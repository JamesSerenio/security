import React, { useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonInput,
  IonButton,
  IonText,
  IonLabel,
  IonItem,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonLoading
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const history = useHistory();

  const handleLogin = async () => {
    setErrorMsg('');
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    if (data.user) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (profileError || !profile) {
        setErrorMsg('Profile not found or error fetching profile.');
        return;
      }

      if (profile.role === 'admin') {
        history.push('/admin');
      } else {
        history.push('/home');
      }
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar style={{ '--background': '#000000' }}>
          <IonTitle className="ion-text-center" style={{ color: '#007bff' }}>
            Secure Login
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding" style={{ backgroundColor: '#000000' }}>
        <IonLoading isOpen={loading} message={'Logging in...'} spinner="dots" />

        <IonGrid className="ion-justify-content-center ion-align-items-center" style={{ height: '100%' }}>
          <IonRow className="ion-justify-content-center">
            <IonCol size-md="6" size-lg="4">
              <IonCard style={{ backgroundColor: '#000000', border: '1px solid #007bff', borderRadius: '16px' }}>
                <IonCardHeader>
                  <IonCardTitle className="ion-text-center" style={{ color: '#007bff', fontSize: '1.8rem' }}>
                    Welcome Back
                  </IonCardTitle>
                </IonCardHeader>

                <IonCardContent>
                  <IonItem lines="full" style={{ backgroundColor: '#000000', borderBottom: '1px solid #222' }}>
                    <IonLabel position="floating" style={{ color: '#888' }}>
                     
                    </IonLabel>
                    <IonInput
                      type="email"
                      value={email}
                      placeholder="Email"
                      onIonChange={e => setEmail(e.detail.value!)}
                      style={{ color: '#fff' }}
                      required
                    />
                  </IonItem>

                  <IonItem
                    lines="full"
                    style={{ backgroundColor: '#121212', borderBottom: '1px solid #222', marginTop: '12px' }}
                  >
                    <IonLabel position="floating" style={{ color: '#888' }}>
                    
                    </IonLabel>
                    <IonInput
                      type="password"
                      value={password}
                      placeholder="Password"
                      onIonChange={e => setPassword(e.detail.value!)}
                      style={{ color: '#fff' }}
                      required
                    />
                  </IonItem>

                  {errorMsg && (
                    <IonText color="danger">
                      <p className="ion-padding-top">{errorMsg}</p>
                    </IonText>
                  )}

                  <IonButton
                    expand="block"
                    onClick={handleLogin}
                    disabled={loading}
                    fill="clear"
                    style={{
                      marginTop: '20px',
                      fontWeight: 'bold',
                      borderRadius: '10px',
                      border: '2px solid #007bff',
                      color: '#007bff'
                    }}
                    className="blue-border-button"
                  >
                    Login
                  </IonButton>

                  <IonText className="ion-text-center ion-margin-top">
                    <p style={{ color: '#ccc' }}>
                      Don't have an account?{' '}
                      <IonText
                        style={{ color: '#007bff', cursor: 'pointer' }}
                        onClick={() => history.push('/register')}
                      >
                        Sign up
                      </IonText>
                    </p>
                  </IonText>
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default Login;
