import React, { useEffect, useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonText,
  IonButton,
  IonTextarea,
  IonItemDivider,
} from '@ionic/react';
import { supabase } from '../supabaseClient';

type IncidentReport = {
  id: number;
  title: string;
  user_id: string;
  description: string;
  type: string;
  barangay: string;
  status: string;
  date_reported: string;
};

const AdminDashboard: React.FC = () => {
  const [reports, setReports] = useState<IncidentReport[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedReport, setSelectedReport] = useState<IncidentReport | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAllReports = async () => {
      const { data, error } = await supabase
        .from('incident_reports')
        .select('*')
        .order('date_reported', { ascending: false });

      if (error) {
        setErrorMsg(error.message);
      } else {
        setReports(data as IncidentReport[]);
      }
    };

    fetchAllReports();
  }, []);

  const updateReportStatus = async (status: string) => {
    if (!selectedReport) return;
    setLoading(true);

    // Update status in database
    const { error } = await supabase
      .from('incident_reports')
      .update({ status })
      .eq('id', selectedReport.id);

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    // Optionally: send message to user here (not implemented in this example)

    // Update local state
    setReports((prev) =>
      prev.map((r) =>
        r.id === selectedReport.id ? { ...r, status } : r
      )
    );
    setSelectedReport((prev) => (prev ? { ...prev, status } : null));
    setMessage('');
    setLoading(false);
  };

  const formatPHTime = (dateString: string) => {
    try {
      const utcDate = new Date(dateString);
      if (isNaN(utcDate.getTime())) return 'Invalid date';

      // Add 8 hours for PH timezone
      const phDate = new Date(utcDate.getTime() + 8 * 60 * 60 * 1000);

      return phDate.toLocaleString('en-PH', {
        year: 'numeric',
        month: 'long',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return 'Invalid date';
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Admin Dashboard</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {errorMsg && <IonText color="danger">{errorMsg}</IonText>}

        <IonList>
          {reports.length === 0 && <IonText>No reports found.</IonText>}

          {reports.map((report) => (
            <IonItem
              key={report.id}
              button
              onClick={() => setSelectedReport(report)}
              detail={selectedReport?.id === report.id}
            >
              <IonLabel>
                <h2>{report.title}</h2>
                <p>
                  <strong>Type:</strong> {report.type} | <strong>Barangay:</strong>{' '}
                  {report.barangay}
                </p>
                <p>{report.description}</p>
                <p>
                  <small>
                    Date Reported: {formatPHTime(report.date_reported)}
                  </small>
                </p>
                <p>
                  <small>User ID: {report.user_id}</small>
                </p>
              </IonLabel>
              <IonBadge
                color={
                  report.status === 'Pending'
                    ? 'warning'
                    : report.status === 'In Progress'
                    ? 'primary'
                    : report.status === 'Resolved'
                    ? 'success'
                    : 'medium'
                }
              >
                {report.status}
              </IonBadge>
            </IonItem>
          ))}
        </IonList>

        {selectedReport && (
          <>
            <IonItemDivider>
              <IonLabel>
                <h3>Send Message / Update Status</h3>
              </IonLabel>
            </IonItemDivider>

            <IonItem>
              <IonTextarea
                placeholder="Type your message here..."
                value={message}
                onIonChange={(e) => setMessage(e.detail.value ?? '')}
                rows={4}
              />
            </IonItem>

            <IonButton
              expand="block"
              onClick={() => updateReportStatus('In Progress')}
              disabled={loading || selectedReport.status === 'In Progress' || selectedReport.status === 'Resolved'}
              className="ion-margin-top"
            >
              Mark as In Progress
            </IonButton>

            <IonButton
              expand="block"
              color="success"
              onClick={() => updateReportStatus('Resolved')}
              disabled={loading || selectedReport.status === 'Resolved'}
              className="ion-margin-top"
            >
              Mark as Resolved
            </IonButton>
          </>
        )}
      </IonContent>
    </IonPage>
  );
};

export default AdminDashboard;
