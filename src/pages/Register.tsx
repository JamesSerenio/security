import React, { useState } from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonInput, IonButton, IonText, IonLabel, IonItem } from '@ionic/react';
import { supabase } from '../supabaseClient';

const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

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
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
    } else {
      setSuccessMsg('Registration successful! Please check your email to confirm your account.');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Register</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonItem>
          <IonLabel position="floating">Email</IonLabel>
          <IonInput type="email" value={email} onIonChange={e => setEmail(e.detail.value!)} />
        </IonItem>
        <IonItem>
          <IonLabel position="floating">Password</IonLabel>
          <IonInput type="password" value={password} onIonChange={e => setPassword(e.detail.value!)} />
        </IonItem>
        <IonItem>
          <IonLabel position="floating">Confirm Password</IonLabel>
          <IonInput type="password" value={confirmPassword} onIonChange={e => setConfirmPassword(e.detail.value!)} />
        </IonItem>
        {errorMsg && <IonText color="danger">{errorMsg}</IonText>}
        {successMsg && <IonText color="success">{successMsg}</IonText>}
        <IonButton expand="block" onClick={handleRegister} disabled={loading} className="ion-margin-top">
          {loading ? 'Registering...' : 'Register'}
        </IonButton>
        <IonButton fill="clear" expand="block" routerLink="/login" className="ion-margin-top">
          Already have an account? Login here
        </IonButton>
      </IonContent>
    </IonPage>
  );
};

export default Register;
