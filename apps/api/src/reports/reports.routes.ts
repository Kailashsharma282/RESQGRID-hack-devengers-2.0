import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';
import { AIService } from '../ai/ai.service';
import { DeduplicationService } from '../deduplication/deduplication.service';
import { SeverityService } from '../severity/severity.service';
import { MatchingService } from '../matching/matching.service';
import { broadcastEvent } from '../events/websocket.gateway';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { WS_EVENTS, IncidentStatus } from '@resqgrid/types';

export const reportsRouter = Router();

// Submit Emergency Report
reportsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const {
      text,
      category: inputCategory,
      latitude = 37.7749,
      longitude = -122.4194,
      address = 'Innovation District, Main Campus',
      reporterId,
      mediaUrl,
      source = 'WEB_APP',
    } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Report text is required.' });
    }

    // 1. Run AI Intelligence Signal Extraction
    const aiAnalysis = await AIService.analyzeIncidentReport(text, inputCategory, address);

    // 2. Check for Duplicate Incident Clusters
    const dupResult = await DeduplicationService.checkDuplicate(
      text,
      aiAnalysis.category,
      parseFloat(latitude),
      parseFloat(longitude)
    );

    let incidentId: string;
    let incidentCode: string;
    let isMergedDuplicate = false;

    if (dupResult.isDuplicate && dupResult.primaryIncidentId) {
      // Group with existing incident!
      incidentId = dupResult.primaryIncidentId;
      isMergedDuplicate = true;

      const existingIncident = await prisma.incident.findUnique({
        where: { id: incidentId },
        include: { reports: true },
      });

      incidentCode = existingIncident?.incidentCode || 'RQ-EXISTING';

      // Attach new report
      await prisma.incidentReport.create({
        data: {
          incidentId,
          reporterId: reporterId || null,
          text,
          mediaUrl: mediaUrl || null,
          source,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          extractedData: JSON.stringify(aiAnalysis),
          confidenceScore: aiAnalysis.confidenceScore,
        },
      });

      // Update incident confidence & affected numbers if newer signal indicates more
      const updatedAffected = Math.max(existingIncident?.affectedPeople || 0, aiAnalysis.affectedPeople);
      const updatedVulnerable = Math.max(existingIncident?.vulnerablePeople || 0, aiAnalysis.vulnerablePeople);
      const updatedConfidence = Math.min(0.99, (existingIncident?.confidenceScore || 0.85) + 0.05);

      const updatedIncident = await prisma.incident.update({
        where: { id: incidentId },
        data: {
          affectedPeople: updatedAffected,
          vulnerablePeople: updatedVulnerable,
          confidenceScore: updatedConfidence,
        },
        include: {
          reports: true,
          dispatches: { include: { resource: true } },
        },
      });

      // Notify and Audit
      await NotificationsService.createNotification({
        incidentId,
        type: 'DUPLICATE_REPORT',
        title: `Duplicate Signal Fused: ${incidentCode}`,
        message: `${dupResult.similarityPercentage}% similarity. Corroborated report fused into ${existingIncident?.title}.`,
      });

      await AuditService.log({
        action: 'incident_merged',
        entityType: 'INCIDENT',
        entityId: incidentId,
        metadata: {
          duplicateReport: text,
          similarityPercentage: dupResult.similarityPercentage,
          reason: dupResult.explanation,
        },
      });

      broadcastEvent(WS_EVENTS.INCIDENT_UPDATED, updatedIncident, incidentId);
      broadcastEvent(WS_EVENTS.REPORT_RECEIVED, {
        reportText: text,
        incidentId,
        isDuplicate: true,
      });

      return res.status(200).json({
        success: true,
        isDuplicate: true,
        message: 'Report fused with existing active incident.',
        incidentCode,
        incidentId,
        aiAnalysis,
        duplicateAnalysis: dupResult,
      });
    }

    // 3. Unique Incident -> Create Brand New Incident
    const count = await prisma.incident.count();
    const year = new Date().getFullYear();
    incidentCode = `RQ-${year}-${String(count + 1).padStart(4, '0')}`;

    // Calculate deterministic severity
    const severityCalc = SeverityService.calculateSeverity({
      category: aiAnalysis.category,
      affectedPeople: aiAnalysis.affectedPeople,
      vulnerablePeople: aiAnalysis.vulnerablePeople,
      confidenceScore: aiAnalysis.confidenceScore,
      hasImmediateLifeThreat: aiAnalysis.severity === 'CRITICAL',
      hasTrappedIndividuals: aiAnalysis.vulnerablePeople > 0,
    });

    const newIncident = await prisma.incident.create({
      data: {
        incidentCode,
        title: aiAnalysis.title,
        description: text,
        category: aiAnalysis.category,
        severity: severityCalc.severity,
        status: IncidentStatus.REPORTED,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        address,
        affectedPeople: aiAnalysis.affectedPeople,
        vulnerablePeople: aiAnalysis.vulnerablePeople,
        confidenceScore: aiAnalysis.confidenceScore,
        priorityScore: severityCalc.priorityScore,
        source,
        aiSummary: aiAnalysis.summary,
        aiReasoning: `${aiAnalysis.reasoning} | ${severityCalc.explanation}`,
        createdBy: reporterId || null,
        reports: {
          create: {
            reporterId: reporterId || null,
            text,
            mediaUrl: mediaUrl || null,
            source,
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            extractedData: JSON.stringify(aiAnalysis),
            confidenceScore: aiAnalysis.confidenceScore,
          },
        },
      },
      include: {
        reports: true,
        dispatches: { include: { resource: true } },
      },
    });

    // 4. Precompute Recommended Resources
    const recommendedResources = await MatchingService.matchResourcesForIncident(
      newIncident.id,
      newIncident.latitude,
      newIncident.longitude,
      aiAnalysis.requiredResources
    );

    // 5. Broadcast Real-Time Events
    broadcastEvent(WS_EVENTS.INCIDENT_CREATED, newIncident);
    broadcastEvent(WS_EVENTS.REPORT_RECEIVED, {
      reportText: text,
      incidentId: newIncident.id,
      isDuplicate: false,
    });

    // 6. Notifications & Audit
    await NotificationsService.createNotification({
      incidentId: newIncident.id,
      type: 'INCIDENT_ALERT',
      title: `${newIncident.severity} Emergency: ${incidentCode}`,
      message: `${newIncident.title} - ${newIncident.category}. AI assigned priority ${severityCalc.priorityScore}/100.`,
    });

    await AuditService.log({
      action: 'incident_created',
      entityType: 'INCIDENT',
      entityId: newIncident.id,
      metadata: {
        incidentCode,
        category: newIncident.category,
        severity: newIncident.severity,
        priorityScore: severityCalc.priorityScore,
        aiSummary: aiAnalysis.summary,
      },
    });

    return res.status(201).json({
      success: true,
      isDuplicate: false,
      message: 'New incident created and registered.',
      incidentCode,
      incidentId: newIncident.id,
      incident: newIncident,
      aiAnalysis,
      recommendedResources: recommendedResources.slice(0, 5),
    });
  } catch (error: any) {
    console.error('[Reports] Error submitting report:', error);
    return res.status(500).json({ success: false, message: 'Failed to process emergency report.' });
  }
});

// List all reports
reportsRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const reports = await prisma.incidentReport.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: {
        reporter: { select: { id: true, name: true, role: true } },
        incident: { select: { id: true, incidentCode: true, title: true, severity: true, status: true } },
      },
    });

    return res.json({ success: true, data: reports });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve reports.' });
  }
});
