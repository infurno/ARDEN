#!/bin/bash

# ARDEN Weather Forecast Tool
# Gets 3-day detailed forecast

LOCATION="${1:-Chicago}"

echo "3-Day Forecast for ${LOCATION}:"
echo ""

# Get formatted forecast
curl -s "wttr.in/${LOCATION}?format=3" 2>/dev/null

# Get moon phase
echo ""
echo "Moon Phase:"
curl -s "wttr.in/${LOCATION}?format=%m" 2>/dev/null
echo ""
