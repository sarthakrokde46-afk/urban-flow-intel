import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/flood/sensor_data")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const data = await request.json();

          console.log("ESP32 Sensor Data:", data);

          return Response.json({
            success: true,
            message: "Sensor data received",
            data,
          });
        } catch (error) {
          console.error("ESP32 API Error:", error);

          return Response.json(
            {
              success: false,
              message: "Invalid sensor data",
            },
            { status: 400 },
          );
        }
      },
    },
  },
});