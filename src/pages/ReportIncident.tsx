import React, { useState } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonInput, IonTextarea, IonButton, IonItem, IonLabel,
  IonText, IonSelect, IonSelectOption
} from '@ionic/react';
import { supabase } from '../supabaseClient';

const INCIDENT_TYPES = [
  'Phishing',
  'Malware',
  'Social Engineering',
  'Data Breach',
  'Online Scam',
  'Cyberbullying',
  'Facebook Hack',
  'Other'
];

const ReportIncident: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<string | undefined>(undefined);
  const [barangay, setBarangay] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    if (!title || !description || !type || !barangay) {
      setErrorMsg('Please fill in all fields');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setErrorMsg('You must be logged in to submit.');
      return;
    }

    const { error } = await supabase.from('incident_reports').insert([{
      user_id: user.id,
      title,
      description,
      type,
      barangay,
      // date_reported & status will default in DB
    }]);

    if (error) {
      setErrorMsg(error.message);
    } else {
      setSuccessMsg('Incident reported successfully!');
      setTitle('');
      setDescription('');
      setType(undefined);
      setBarangay('');
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar><IonTitle>Report Incident</IonTitle></IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonItem>
          <IonLabel position="floating">Title</IonLabel>
          <IonInput value={title} onIonChange={e => setTitle(e.detail.value!)} />
        </IonItem>
        <IonItem>
          <IonLabel position="floating">Description</IonLabel>
          <IonTextarea value={description} onIonChange={e => setDescription(e.detail.value!)} rows={6} />
        </IonItem>
        <IonItem>
          <IonLabel>Type</IonLabel>
          <IonSelect
            value={type}
            placeholder="Select type"
            onIonChange={e => setType(e.detail.value)}
          >
            {INCIDENT_TYPES.map(t => (
              <IonSelectOption key={t} value={t}>{t}</IonSelectOption>
            ))}
          </IonSelect>
        </IonItem>
        <IonItem>
          <IonLabel position="floating">Barangay</IonLabel>
          <IonInput value={barangay} onIonChange={e => setBarangay(e.detail.value!)} />
        </IonItem>

        {errorMsg && <IonText color="danger">{errorMsg}</IonText>}
        {successMsg && <IonText color="success">{successMsg}</IonText>}

        <IonButton expand="block" onClick={handleSubmit} className="ion-margin-top">
          Submit
        </IonButton>
      </IonContent>
    </IonPage>
  );
};

export default ReportIncident;
