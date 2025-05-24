import React from 'react';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Route, Redirect, Switch } from 'react-router-dom';

import Login from './pages/Login';
import Register from './pages/Register';
import ReportIncident from './pages/ReportIncident';
import MyReports from './pages/MyReports';
import AdminDashboard from './pages/AdminDashboard';
import ImpactReport from './pages/ImpactReport';
import Home from './pages/Home';

import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';
import '@ionic/react/css/palettes/dark.system.css';
import './theme/variables.css';

setupIonicReact();

const App: React.FC = () => (
  <IonApp>
    <IonReactRouter>
      <IonRouterOutlet>
        <Switch>
          <Route path="/login" component={Login} exact />
          <Route path="/register" component={Register} exact />
          <Route path="/report" component={ReportIncident} exact />
          <Route path="/my-reports" component={MyReports} exact />
          <Route path="/admin" component={AdminDashboard} exact />
          <Route path="/impact-report" component={ImpactReport} exact />
          <Route path="/home" component={Home} exact />
          <Redirect exact from="/" to="/login" />
        </Switch>
      </IonRouterOutlet>
    </IonReactRouter>
  </IonApp>
);

export default App;
