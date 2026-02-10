import React, { useState } from 'react';
import SalesmanDashboardScreen from './SalesmanDashboardScreen';
import SalesmanVisitScreen from './SalesmanVisitScreen';
import SalesmanManualVisitScreen from './SalesmanManualVisitScreen';

export default function SalesmanPortal() {
  const [route, setRoute] = useState({ name: 'home', beat: null });
  const [refreshKey, setRefreshKey] = useState(0);

  if (route.name === 'visit') {
    return (
      <SalesmanVisitScreen
        beat={route.beat}
        onBack={() => {
          setRoute({ name: 'home', beat: null });
          setRefreshKey((prev) => prev + 1);
        }}
      />
    );
  }
  if (route.name === 'manual') {
    return (
      <SalesmanManualVisitScreen
        onBack={() => {
          setRoute({ name: 'home', beat: null });
          setRefreshKey((prev) => prev + 1);
        }}
      />
    );
  }

  return (
    <SalesmanDashboardScreen
      refreshKey={refreshKey}
      onOpenVisit={(beat) => setRoute({ name: 'visit', beat })}
      onOpenManual={() => setRoute({ name: 'manual', beat: null })}
    />
  );
}
