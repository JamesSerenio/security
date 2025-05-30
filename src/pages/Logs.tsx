
import React, { useEffect, useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonText,
  IonSpinner,
} from '@ionic/react';
import { supabase } from '../supabaseClient';

type UserLog = {
  id: number;
  user_email: string;
  action: 'login' | 'register' | 'logout' | 'login_failed' | 'profile_fetch_failed' | 'unexpected_error';
  details: string | null;
  timestamp: string;
};

const Logs: React.FC = () => {
  const [logs, setLogs] = useState<UserLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    setError('');
    const { data, error } = await supabase
      .from('user_logs')
      .select('*')
      .order('timestamp', { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setLogs(data as UserLog[]);
    }
    setLoading(false);
  };
const formatPHTime = (dateString: string) => {
  const utcDate = new Date(dateString);
  if (isNaN(utcDate.getTime())) return 'Invalid date';

  // Manually add +8 hours for PH time
  const phDate = new Date(utcDate.getTime() - 8 * 60 * 60 * 1000);

  return phDate.toLocaleString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};



  return (
    
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>User Logs</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {loading && <IonSpinner name="dots" />}
        {error && <IonText color="danger">{error}</IonText>}

        {!loading && !error && logs.length === 0 && (
          <IonText>No logs found.</IonText>
        )}

        {!loading && logs.length > 0 && (
          <IonGrid>
            <IonRow
              style={{
                position: 'sticky',
                top: 0,
                backgroundColor: '#424242',
                zIndex: 10,
                fontWeight: 'bold',
                borderBottom: '1px solid #ccc',
                paddingBottom: '6px'
              }}
            >
              <IonCol size="3">User Email</IonCol>
              <IonCol size="2">Action</IonCol>
              <IonCol size="4">Details</IonCol>
              <IonCol size="3">Timestamp</IonCol>
            </IonRow>

            {logs.map((log) => (
              <IonRow key={log.id} style={{ borderBottom: '1px solid #eee', padding: '6px 0' }}>
                <IonCol size="3">{log.user_email}</IonCol>
                <IonCol size="2" style={{ textTransform: 'capitalize' }}>{log.action.replace(/_/g, ' ')}</IonCol>
                <IonCol size="4">{log.details || '-'}</IonCol>
                <IonCol size="3">{formatPHTime(log.timestamp)}</IonCol>
              </IonRow>
            ))}
          </IonGrid>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Logs;
