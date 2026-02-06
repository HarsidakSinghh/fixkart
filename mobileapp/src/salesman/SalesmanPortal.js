import React, { useState } from 'react';
import SalesmanDashboardScreen from './SalesmanDashboardScreen';
import SalesmanVisitScreen from './SalesmanVisitScreen';

export default function SalesmanPortal() {
  const [route, setRoute] = useState({ name: 'home', beat: null });

  if (route.name === 'visit') {
    return (
      <SalesmanVisitScreen
        beat={route.beat}
        onBack={() => setRoute({ name: 'home', beat: null })}
      />
    );
  }

  return (
    <SalesmanDashboardScreen
      onOpenVisit={(beat) => setRoute({ name: 'visit', beat })}
    />
  );
}
