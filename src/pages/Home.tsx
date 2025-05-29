import React from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonToast } from '@ionic/react';
import { supabase } from '../supabaseClient';
import { useHistory } from 'react-router-dom';



const Home: React.FC = () => {
  const history = useHistory();
  const [showToast, setShowToast] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState('');

  const blueBorderButtonStyle: React.CSSProperties = {
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#007bff',
    color: '#007bff',
    background: 'transparent',
    fontWeight: 'bold',
    borderRadius: '10px',
    marginTop: '20px',
  };

const handleLogout = async () => {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      setToastMessage('Error: User not found or session expired.');
      setShowToast(true);
      return;
    }

    // Log logout with user email
    const userEmail = user.email ?? null;
    if (!userEmail) {
      setToastMessage('User email not available for logging.');
      setShowToast(true);
      return;
    }

    const { error: logError } = await supabase
      .from('user_logs')
      .insert([
        {
          user_email: userEmail,
          action: 'logout',
        },
      ]);

    if (logError) {
      console.error('Error logging logout action:', logError.message);
      setToastMessage('Logout log error: ' + logError.message);
      setShowToast(true);
    } else {
      console.log(`Logout action logged for user email: ${userEmail}`);
    }

    // Sign out user
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      console.error('Error signing out:', signOutError.message);
      setToastMessage('Error logging out: ' + signOutError.message);
      setShowToast(true);
      return;
    }

    setToastMessage('Logged out successfully');
    setShowToast(true);

    setTimeout(() => {
      history.push('/login');
    }, 1500);
  } catch (err) {
    console.error('Unexpected error during logout:', err);
    setToastMessage('Unexpected error during logout.');
    setShowToast(true);
  }
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
          backgroundColor: '#000000',
          textAlign: 'center',
          color: '#007bff',
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
        <IonButton
          onClick={handleLogout}
          fill="clear"
          style={{
            ...blueBorderButtonStyle,
            width: '200px',
            marginLeft: 'auto',
            marginRight: 'auto',
            textAlign: 'center',
          }}
        >
          Logout
        </IonButton>

        <IonToast
          isOpen={showToast}
          message={toastMessage}
          duration={1500}
          onDidDismiss={() => setShowToast(false)}
          position="bottom"
          color={toastMessage.toLowerCase().includes('error') ? 'danger' : 'primary'}
        />
      </IonContent>
    </IonPage>
  );
};

export default Home;
