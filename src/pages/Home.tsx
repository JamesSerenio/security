import React from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton } from '@ionic/react';

const Home: React.FC = () => {
  const blueBorderButtonStyle: React.CSSProperties = {
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#007bff',   // blue border
    color: '#007bff',         // blue text
    background: 'transparent',
    fontWeight: 'bold',
    borderRadius: '10px',
    marginTop: '20px',
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar style={{ '--background': '#000000' }}>
          <IonTitle style={{ color: '#007bff', textAlign: 'center' }}>Home</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent 
        fullscreen
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center', 
          alignItems: 'center', 
          backgroundColor: '#000000',  // black background
          textAlign: 'center',
          color: '#007bff',            // blue text
          padding: '0 20px',
        }}
      >
        <h2>Welcome to the Incident Reporting System</h2>
        <IonButton
          href="/report"
          fill="clear"
          style={{
            ...blueBorderButtonStyle,
            width: '200px',
            marginLeft: 'auto',
            marginRight: 'auto',
            textAlign: 'center',
          }}
        >
          Report Incident
        </IonButton>
      </IonContent>
    </IonPage>
  );
};

export default Home;
