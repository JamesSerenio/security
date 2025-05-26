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
  IonItem
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
      // Fetch the user's profile from 'profiles' table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (profileError || !profile) {
        setErrorMsg('Profile not found or error fetching profile.');
        return;
      }

      // Redirect based on role
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
        <IonToolbar>
          <IonTitle>Login</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonItem>
          <IonLabel position="floating">Email</IonLabel>
          <IonInput
            type="email"
            value={email}
            onIonChange={e => setEmail(e.detail.value!)}
          />
        </IonItem>
        <IonItem>
          <IonLabel position="floating">Password</IonLabel>
          <IonInput
            type="password"
            value={password}
            onIonChange={e => setPassword(e.detail.value!)}
          />
        </IonItem>
        {errorMsg && <IonText color="danger"><p>{errorMsg}</p></IonText>}
        <IonButton
          expand="block"
          onClick={handleLogin}
          disabled={loading}
          className="ion-margin-top"
        >
          {loading ? 'Logging in...' : 'Login'}
        </IonButton>

        <IonText className="ion-text-center ion-margin-top">
          <p>
            Don't have an account?{' '}
            <IonText color="primary" onClick={() => history.push('/register')} style={{ cursor: 'pointer' }}>
              Sign up
            </IonText>
          </p>
        </IonText>
      </IonContent>
    </IonPage>
  );
};

export default Login;
