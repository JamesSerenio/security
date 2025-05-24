import React from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton } from '@ionic/react';

const Home: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar><IonTitle>Home</IonTitle></IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <h2>Welcome to the Incident Reporting System</h2>
        <p>Use the menu to report incidents, view your reports, or check impact reports.</p>
        <IonButton expand="block" href="/report" className="ion-margin-top">
          Report Incident
        </IonButton>
      </IonContent>
    </IonPage>
  );
};

export default Home;
