import * as dashboardService from '../services/dashboardService.js';

export async function getOverview(req, res, next) {
  try {
    const data = await dashboardService.getDashboardOverview();
    return res.status(200).json({
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
      },
    });
  } catch (error) {
    next(error);
  }
}
