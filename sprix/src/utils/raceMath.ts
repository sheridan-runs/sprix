// src/utils/raceMath.ts

export const timeToSeconds = (timeStr: string): number => {
  const parts = timeStr.split(':').map(Number);
  let seconds = 0;
  if (parts.length === 3) {
    seconds += parts[0] * 3600; 
    seconds += parts[1] * 60;   
    seconds += parts[2];        
  } else if (parts.length === 2) {
    seconds += parts[0] * 60;   
    seconds += parts[1];        
  }
  return seconds;
};

export const secondsToTime = (totalSeconds: number, showHours: boolean = false): string => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.round(totalSeconds % 60);

  const mStr = m.toString().padStart(2, '0');
  const sStr = s.toString().padStart(2, '0');

  if (showHours || h > 0) {
    return `${h}:${mStr}:${sStr}`;
  }
  return `${m}:${sStr}`;
};

export interface Split {
  distance: number;       
  splitTime: string;      
  elapsedTime: string;    
  isMajorMarker: boolean; 
}

export const calculateSplits = (
  totalDistanceKm: number, 
  goalTimeStr: string,
  strategy: 'even' | 'negative' = 'even' 
): Split[] => {
  const totalSeconds = timeToSeconds(goalTimeStr);
  if (totalDistanceKm <= 0 || totalSeconds <= 0) return [];

  const splits: Split[] = [];
  let currentElapsed = 0;

  // Calculate Average Pace
  const avgPace = totalSeconds / totalDistanceKm;

  // Negative Split Logic:
  // We want the second half to be faster. 
  // Simple Linear Progression: Start at 103% of avg pace, End at 97% of avg pace.
  // Slope = (EndPace - StartPace) / TotalDistance
  const startPace = strategy === 'negative' ? avgPace * 1.03 : avgPace;
  const endPace = strategy === 'negative' ? avgPace * 0.97 : avgPace;
  const paceStep = (endPace - startPace) / totalDistanceKm;

  for (let d = 1; d <= Math.floor(totalDistanceKm); d++) {
    // Calculate pace for this specific kilometer
    const currentKmPace = strategy === 'even' 
      ? avgPace 
      : startPace + (paceStep * (d - 0.5)); // Use mid-point of km for accuracy

    currentElapsed += currentKmPace;
    
    splits.push({
      distance: d,
      splitTime: secondsToTime(currentKmPace),
      elapsedTime: secondsToTime(currentElapsed, true),
      isMajorMarker: d % 5 === 0 
    });
  }

  // Handle final partial distance
  if (totalDistanceKm % 1 !== 0) {
    const remainingDist = totalDistanceKm % 1;
    if (remainingDist > 0.01) {
        // Force the final time to match the goal exactly (correcting any floating point drift)
        const finalTime = totalSeconds; 
        const segmentTime = finalTime - currentElapsed;

        splits.push({
        distance: totalDistanceKm,
        splitTime: secondsToTime(segmentTime / remainingDist), // Show pace for this segment
        elapsedTime: secondsToTime(finalTime, true),
        isMajorMarker: true 
        });
    }
  }

  return splits;
};

// NEW: Helper function to determine when to start the "Kick"
export const getKickDistance = (distanceKm: number): string => {
  // Handle Marathons (approx 42km)
  if (distanceKm >= 42) return "final 10km";
  
  // Handle Half Marathons (approx 21km)
  if (distanceKm >= 21) return "final 5km";
  
  // Handle 10k
  if (distanceKm >= 10) return "final 2km";
  
  // Handle 5k and short races
  return "final 1km";
};
