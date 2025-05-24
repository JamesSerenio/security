import React, { useEffect, useState } from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonText } from '@ionic/react';
import { supabase } from '../supabaseClient';

type IncidentSummary = {
  barangay: string;
  type: string;
  status: string;
  total: number;
};

const ImpactReport: React.FC = () => {
  const [summary, setSummary] = useState<IncidentSummary[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchSummary = async () => {
      const { data, error } = await supabase
        .from('incident_summary')
        .select('*')
        .order('barangay', { ascending: true });

      if (error) {
        setErrorMsg(error.message);
      } else {
        setSummary(data as IncidentSummary[]);
      }
    };
    fetchSummary();
  }, []);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar><IonTitle>Impact Report</IonTitle></IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {errorMsg && <IonText color="danger">{errorMsg}</IonText>}
        <IonList>
          {summary.length === 0 ? (
            <IonText>No data available.</IonText>
          ) : (
            summary.map((item, idx) => (
              <IonItem key={idx}>
                <IonLabel>
                  <h3>{item.barangay}</h3>
                  <p><strong>Type:</strong> {item.type}</p>
                  <p><strong>Status:</strong> {item.status}</p>
                  <p><strong>Total Incidents:</strong> {item.total}</p>
                </IonLabel>
              </IonItem>
            ))
          )}
        </IonList>
      </IonContent>
    </IonPage>
  );
};

export default ImpactReport;
