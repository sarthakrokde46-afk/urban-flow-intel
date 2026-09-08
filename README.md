# Flow Guardian

Build a fully functional web application for the project:

AI-BASED URBAN FLOOD PREDICTION AND CAPACITY-AWARE MITIGATION SYSTEM

OBJECTIVE

Create an interactive disaster-management application that predicts urban flooding 0–3 hours in advance and provides actionable, capacity-aware mitigation recommendations.

The application should demonstrate the complete workflow:

Rainfall/Weather Data → Flood Prediction → Flood Risk Map → Water/Drainage Capacity Analysis → Mitigation Decision → Emergency Response → Continuous Monitoring

This must be a functional working prototype, not a static UI mockup.

1. TECH STACK

Use:

Frontend: HTML + JavaScript

Backend: Python + FastAPI

Database: PostgreSQL/PostGIS if required

AI/ML: Python

Maps: Leaflet.js + OpenStreetMap

Charts: Chart.js

API communication: REST API

Styling: Keep the interface clean and professional; do not overcomplicate it.

The application must be easy to run locally in VS Code.

2. MAIN DASHBOARD

Create a professional Flood Command Dashboard.

The dashboard should contain:

Top section

Application name

Current system status

Last data update

Current rainfall

Current water level

Overall flood risk

Main section

Show a large interactive map of the selected urban area.

The map should display:

Flood-risk zones

Flooded/predicted streets

Drainage network

Underground diversion tunnel

Storage tanks

Pumping stations

River

Critical infrastructure

Emergency routes

Use different visual indicators for:

🟢 Low Risk
🟡 Moderate Risk
🟠 High Risk
🔴 Critical Risk

3. FLOOD NOWCASTING

Create a flood prediction panel.

Display:

Rainfall intensity

Predicted rainfall

Current water level

Predicted water level

Flood probability

Expected flood depth

Estimated time to flooding

Flood severity

Example:

Location: Zone A
Flood Probability: 87%
Expected Depth: 42 cm
Time to Flood: 38 minutes
Severity: HIGH

The values should update dynamically.

4. AI PREDICTION

Create a Python ML module that accepts inputs such as:

rainfall intensity

cumulative rainfall

water level

elevation

drainage capacity

storage capacity

historical flood information

Return:

flood_probability
predicted_water_depth
time_to_flood
flood_severity


For the prototype, if real trained data is unavailable, create a clearly identified demo/simulation model so the application remains functional.

Do not falsely claim that simulated results are real-world predictions.

Structure the AI module so a real trained model can later replace the demo model.

5. CAPACITY-AWARE WATER MANAGEMENT

This is the key innovation.

Create a Water Management / Capacity Monitor.

Show all available destinations:

Destination Current Level Capacity Available Capacity Status Tank A 75% 100% 25% Available Tank B 92% 100% 8% Near Full Tank C 100% 100% 0% FULL Drain D 65% 100% 35% Available

The system must continuously calculate available capacity.

6. DYNAMIC WATER DIVERSION

When flood risk increases, the application should determine the safest available destination.

Decision logic:

Flood predicted
      ↓
Calculate incoming water
      ↓
Check all tanks/storage/drainage capacity
      ↓
Find safe available capacity
      ↓
Check downstream flood risk
      ↓
Select safest option
      ↓
Recommend controlled diversion/pumping


Show:

Recommended Action

Example:

Divert excess water toward Tank A
Available capacity: 25%
Estimated safe diversion: 18,000 L/min
Downstream risk: LOW

Include a visual animation on the map showing the direction of water flow.

7. WHEN EVERY TANK IS FULL

This is extremely important.

If all tanks/storage locations are full:

ALL STORAGE FULL
       ↓
STOP ADDITIONAL DIVERSION
       ↓
CHECK REMAINING DRAINAGE CAPACITY
       ↓
CHECK PUMPING OPTIONS
       ↓
PROTECT CRITICAL AREAS
       ↓
TRAFFIC MANAGEMENT
       ↓
EMERGENCY ALERT


The application must never recommend sending water to a full tank.

Display a clear emergency status:

⚠ STORAGE CAPACITY EXHAUSTED
Emergency Mitigation Mode Activated

Then show recommended actions such as:

Stop diversion to full tanks

Maximize safe available drainage

Optimize available pumps

Close predicted-dangerous roads

Protect critical infrastructure

Keep emergency routes clear

Alert authorities

Issue citizen warnings

8. UNDERGROUND FLOOD DIVERSION SYSTEM

Create a dedicated visualization for the proposed infrastructure.

Show:

Urban Flood Zone ↓ Large Underground Diversion Tunnel ↓ Multiple Storage Tanks ↓ Controlled Gates / Pumps ↓ Long-Distance Underground Tunnel ↓ Safe River Discharge

The visualization should show water moving through the underground tunnel.

Allow the user to click a tank and see:

Current level

Maximum capacity

Available capacity

Incoming flow

Outgoing flow

Gate status

Pump status

9. EMERGENCY RESPONSE

Create an emergency-response panel.

Display:

Critical Areas

Hospital

School

Residential zone

Electrical infrastructure

Major road

For each location show:

Flood risk

Expected depth

ETA

Recommended action

10. FLOOD-SAFE ROUTE

Add a route-planning feature.

User enters:

Start → Destination

The system calculates a route while avoiding predicted flooded roads.

Display:

Normal route

Flooded/unsafe roads

Recommended safe route

Estimated travel time

Emergency-route status

If a road becomes flooded, dynamically recalculate the route.

11. ALERT SYSTEM

Create an alert center.

Examples:

🔴 CRITICAL

Flooding predicted in Zone A within 30 minutes.

🟠 WARNING

Drainage capacity approaching critical level at Drain D.

⚠ STORAGE

Tank C has reached 100% capacity.

🚨 EMERGENCY

All nearby storage capacity exhausted. Emergency Mitigation Mode activated.

🟢 RESOLVED

Water level reduced below critical threshold.

Allow alerts to be generated automatically from the simulated data.

12. LIVE MONITORING

Create simulated live data.

Every few seconds update:

Rainfall

Water level

Tank levels

Drain capacity

Flood probability

Flood depth

Use a Simulation Mode button so judges can demonstrate changing conditions.

Include scenarios:

Scenario 1 — Normal Rain

Low flood risk.

Scenario 2 — Heavy Rain

Flood prediction increases and system recommends diversion.

Scenario 3 — Tank Filling

Storage capacity decreases.

Scenario 4 — All Tanks Full

System automatically activates Emergency Mitigation Mode.

Scenario 5 — Flood Recedes

System returns to normal monitoring.

13. ANALYTICS

Create charts for:

Rainfall over time

Water level over time

Predicted flood depth

Tank capacity

Drainage capacity

Flood probability

Show a simple timeline:

Now → +30 min → +60 min → +90 min → +120 min → +180 min

14. SYSTEM ARCHITECTURE

Organize the code into clear modules:

frontend/
    dashboard
    map
    charts
    alerts
    water-management

backend/
    FastAPI
    flood_prediction
    capacity_analysis
    water_diversion
    emergency_response
    route_optimization

data/
    demo rainfall
    demo water levels
    demo drainage
    demo tanks

database/
    locations
    drainage
    tanks
    flood_history


Create clean REST APIs for:

GET /flood/prediction
GET /flood/risk-map
GET /capacity
GET /water-management
GET /alerts
POST /simulate
GET /safe-route


15. JUDGE DEMONSTRATION

Make the application easy to demonstrate in an SIH presentation.

Create a Simulation Control Panel with buttons:

NORMAL → HEAVY RAIN → EXTREME RAIN → TANK FULL → ALL STORAGE FULL → FLOOD RESPONSE → RECOVERY

When the scenario changes, the dashboard, map, capacity values, alerts and recommended actions should change automatically.

16. IMPORTANT PRODUCT PRINCIPLE

The application must communicate this concept clearly:

The system does not blindly divert floodwater. It predicts the flood, checks available infrastructure capacity, evaluates downstream risk, selects the safest available mitigation action, and switches to emergency response when capacity is exhausted.

Make this the central logic of the application.

17. UI REQUIREMENTS

Create a modern professional Smart City / Disaster Management Command Center interface.

Prioritize:

Map visualization

Live flood status

Clear numbers

Capacity indicators

Alerts

Recommended actions

Simple navigation

Do not fill the interface with unnecessary text.

The app should look like a real municipal flood-management control system, while clearly identifying simulated/demo data where applicable.

18. FINAL REQUIREMENT

Provide all necessary files and instructions required to run the application locally.

The application must be:

Functional → Interactive → Demonstrable → Modular → Easy to extend with real data

Do not create only screenshots or a static prototype.

Build the actual working application.


## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
