result = data
    .map((line) => ({
        platformName: line.platformName,
        direction: line.direction,
        timeToStation: line.timeToStation,
        currentLocation: line.currentLocation,
        towards: line.towards,
        expectedArrival: line.expectedArrival
    }))
    .sort((a, b) => a.timeToStation - b.timeToStation)