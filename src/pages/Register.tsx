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
  IonLoading,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const history = useHistory();

  const handleRegister = async () => {
    setErrorMsg('');
    setSuccessMsg('');

    if (!email || !password || !confirmPassword) {
      setErrorMsg('Please fill in all fields.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Passwords don't match.");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
    } else if (data.user) {
      // Insert into profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: data.user.id,
            email: email,
            role: 'user', // default role
          },
        ]);

      if (profileError) {
        setErrorMsg('Registration succeeded, but failed to create user profile.');
        console.error(profileError);
        return;
      }

      setSuccessMsg('Registration successful! Please check your email to confirm your account.');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar style={{ '--background': '#000000' }}>
          <IonTitle className="ion-text-center" style={{ color: '#007bff' }}>
            Register
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding" style={{ backgroundColor: '#121212' }}>
        <IonLoading isOpen={loading} message={'Registering...'} spinner="dots" />

        <IonGrid className="ion-justify-content-center ion-align-items-center" style={{ height: '100%' }}>
          <IonRow className="ion-justify-content-center" style={{ paddingTop: '0px' }}>
            <IonCol size-md="6" size-lg="4">
              <IonCard style={{ backgroundColor: '#000000', border: '1px solid #007bff', borderRadius: '16px' }}>
                <IonCardHeader>
                  <IonCardTitle className="ion-text-center" style={{ color: '#007bff', fontSize: '1.8rem' }}>
                    {/* You can put a header text here if you want */}
                  </IonCardTitle>
                </IonCardHeader>

                <IonCardContent>
                  <IonItem lines="full" style={{ backgroundColor: '#000000', borderBottom: '1px solid #333' }}>
                    <IonLabel position="floating" style={{ color: '#999' }}>
                      {/* Email Label */}
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
                    style={{ backgroundColor: '#000000', borderBottom: '1px solid #333', marginTop: '12px' }}
                  >
                    <IonLabel position="floating" style={{ color: '#999' }}>
                      {/* Password Label */}
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

                  <IonItem
                    lines="full"
                    style={{ backgroundColor: '#000000', borderBottom: '1px solid #333', marginTop: '12px' }}
                  >
                    <IonLabel position="floating" style={{ color: '#999' }}>
                      {/* Confirm Password Label */}
                    </IonLabel>
                    <IonInput
                      type="password"
                      value={confirmPassword}
                      placeholder="Confirm Password"
                      onIonChange={e => setConfirmPassword(e.detail.value!)}
                      style={{ color: '#fff' }}
                      required
                    />
                  </IonItem>

                  {errorMsg && (
                    <IonText color="danger">
                      <p className="ion-padding-top">{errorMsg}</p>
                    </IonText>
                  )}
                  {successMsg && (
                    <IonText color="success">
                      <p className="ion-padding-top">{successMsg}</p>
                    </IonText>
                  )}

                  <IonButton
                    expand="block"
                    onClick={handleRegister}
                    disabled={loading}
                    fill="clear"
                    style={{
                      marginTop: '20px',
                      fontWeight: 'bold',
                      borderRadius: '10px',
                      border: '1px solid #007bff',
                      color: '#007bff',
                      background: 'transparent',
                    }}
                  >
                    {loading ? 'Registering...' : 'Register'}
                  </IonButton>

                  <IonText className="ion-text-center ion-margin-top">
                    <p style={{ color: '#ccc' }}>
                      Already have an account?{' '}
                      <IonText
                        color="light"
                        style={{ color: '#007bff', cursor: 'pointer' }}
                        onClick={() => history.push('/login')}
                      >
                        Login here
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

export default Register;
