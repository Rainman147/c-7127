import React from 'react';
import { RealTimeProvider } from '@/features/realtime/context/RealTimeContext';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Home from './pages/Home';
import Chat from './pages/Chat';
import NotFound from './pages/NotFound';

const App = () => {
  return (
    <RealTimeProvider>
      <Router>
        <Switch>
          <Route path="/" exact component={Home} />
          <Route path="/chat/:id" component={Chat} />
          <Route component={NotFound} />
        </Switch>
      </Router>
    </RealTimeProvider>
  );
};

export default App;
