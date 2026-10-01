const sectorIntelligenceService = require("../services/sectorIntelligenceService");

const getSectorDashboard = async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.user?._id;
    const dashboard = await sectorIntelligenceService.getSectorDashboard(userId);
    res.json({
      success: true,
      data: dashboard,
      error: null
    });
  } catch (err) {
    next(err);
  }
};

const getSectorDetails = async (req, res, next) => {
  try {
    const { sectorName } = req.params;
    const userId = req.user?.userId || req.user?._id;
    const dashboard = await sectorIntelligenceService.getSectorDashboard(userId);
    const decodedName = decodeURIComponent(sectorName);
    const sectorData = dashboard.sectors.find(
      s => s.sector.toLowerCase() === decodedName.toLowerCase()
    );

    if (!sectorData) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { message: `Sector '${decodedName}' not found in verified classification.` }
      });
    }

    res.json({
      success: true,
      data: sectorData,
      error: null
    });
  } catch (err) {
    next(err);
  }
};

const compareSectors = async (req, res, next) => {
  try {
    const { sectorA, sectorB } = req.query;
    if (!sectorA || !sectorB) {
      return res.status(400).json({
        success: false,
        data: null,
        error: { message: "Query parameters 'sectorA' and 'sectorB' are required." }
      });
    }

    const userId = req.user?.userId || req.user?._id;
    const comparison = await sectorIntelligenceService.compareSectors(sectorA, sectorB, userId);

    res.json({
      success: true,
      data: comparison,
      error: null
    });
  } catch (err) {
    next(err);
  }
};

const emitSectorEvents = async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.user?._id;
    const events = await sectorIntelligenceService.checkAndEmitSectorEvents(userId);
    res.json({
      success: true,
      data: { emittedEventsCount: events.length, events },
      error: null
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSectorDashboard,
  getSectorDetails,
  compareSectors,
  emitSectorEvents
};
