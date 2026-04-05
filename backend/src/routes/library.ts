import { Router } from "express";
import axios from "axios";

const router = Router();

router.get("/", async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ success: false, error: "Le token de la BU est requis." });
  }

  try {
    const [liveRes, timetableRes] = await Promise.all([
      axios.get(`https://api.affluences.com/app/v4/sites/${token}/live-data`),
      axios.get(`https://api.affluences.com/app/v4/sites/${token}/timetables?weekOffset=0`)
    ]);

    const liveData = liveRes.data.data;
    const timetableData = timetableRes.data.data;

    // Get today's hours from timetables
    const today = new Date().toISOString().split('T')[0];
    const todayEntry = timetableData.entries.find((e: any) => e.day === today);
    
    let hoursDisplay = "Fermé";
    if (todayEntry && todayEntry.openingHours && todayEntry.openingHours.length > 0) {
      const mainSlot = todayEntry.openingHours[0];
      const start = mainSlot.openingHour.split(' ')[1].substring(0, 5);
      const end = mainSlot.closingHour.split(' ')[1].substring(0, 5);
      hoursDisplay = `${start.replace(':', 'h')} - ${end.replace(':', 'h')}`;
    }

    res.json({
      success: true,
      data: {
        name: liveData.primaryName || "Bibliothèque",
        occupancy: liveData.liveAttendance?.occupancy || 0,
        capacity: liveData.capacity || 0, // Not always present in live-data, might need meta call if missing
        occupiedSeats: liveData.liveAttendance?.currentCount || 0,
        hours: hoursDisplay,
        status: liveData.status?.isOpen ? "ouvert" : "fermé",
        reservationUrl: `https://affluences.com/sites/${token}/reservation`,
        forecasts: (liveData.todayForecasts || []).map((f: any) => ({
          time: f.hourRange[0].split(' ')[1].substring(0, 5),
          occupancy: f.occupancy,
          evolution: f.occupancyEvolution // INCREASE, DECREASE, STABLE
        }))
      }
    });
  } catch (error) {
    console.error("Affluences API error:", error);
    res.status(502).json({ success: false, error: "Impossible de récupérer les données en temps réel." });
  }
});

export default router;
