import React, { useEffect, useState } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonList, IonItem, IonLabel, IonText, IonBadge
} from '@ionic/react';
import { supabase } from '../supabaseClient';

type IncidentReport = {
  id: number;
  title: string;
  description: string;
  type: string;
  barangay: string;
  status: string;
  date_reported: string;
};

const MyReports: React.FC = () => {
  const [reports, setReports] = useState<IncidentReport[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchReports = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setErrorMsg('Not logged in');
        return;
      }
      const { data, error } = await supabase
        .from('incident_reports')
        .select('*')
        .eq('user_id', user.id)
        .order('date_reported', { ascending: false });

      if (error) {
        setErrorMsg(error.message);
      } else {
        setReports(data as IncidentReport[]);
      }
    };
    fetchReports();
  }, []);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar><IonTitle>My Reports</IonTitle></IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {errorMsg && <IonText color="danger">{errorMsg}</IonText>}
        <IonList>
          {reports.length === 0 ? (
            <IonText>No reports found.</IonText>
          ) : (
            reports.map(report => (
              <IonItem key={report.id}>
                <IonLabel>
                  <h2>{report.title}</h2>
                  <p><strong>Type:</strong> {report.type} | <strong>Barangay:</strong> {report.barangay}</p>
                  <p>{report.description}</p>
                  <p><small>{new Date(report.date_reported).toLocaleString()}</small></p>
                </IonLabel>
                <IonBadge color={
                  report.status === 'Pending' ? 'warning' :
                  report.status === 'In Progress' ? 'primary' :
                  report.status === 'Resolved' ? 'success' : 'medium'
                }>
                  {report.status}
                </IonBadge>
              </IonItem>
            ))
          )}
        </IonList>
      </IonContent>
    </IonPage>
  );
};

export default MyReports;
