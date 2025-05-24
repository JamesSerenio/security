import React, { useEffect, useState, useRef } from 'react';
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
  IonButtons,
  IonIcon,
  IonSpinner,
} from '@ionic/react';
import { supabase } from '../supabaseClient';
import { closeOutline } from 'ionicons/icons';

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

type Message = {
  id: number;
  report_id: number;
  sender: 'admin' | 'user';
  message: string;
  created_at: string;
};

const AdminDashboard: React.FC = () => {
  const [reports, setReports] = useState<IncidentReport[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedReport, setSelectedReport] = useState<IncidentReport | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAllReports();
  }, []);

  useEffect(() => {
    if (selectedReport) {
      fetchMessages(selectedReport.id);
    } else {
      setMessages([]);
    }
  }, [selectedReport]);

  useEffect(() => {
    // Auto-scroll chat to bottom on new messages
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchAllReports = async () => {
    setLoading(true);
    setErrorMsg('');
    const { data, error } = await supabase
      .from('incident_reports')
      .select('*')
      .order('date_reported', { ascending: false });
    if (error) {
      setErrorMsg(error.message);
    } else {
      setReports(data as IncidentReport[]);
    }
    setLoading(false);
  };

  const fetchMessages = async (reportId: number) => {
    setErrorMsg('');
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('report_id', reportId)
      .order('created_at', { ascending: true });
    if (error) {
      setErrorMsg(error.message);
    } else {
      setMessages(data as Message[]);
    }
  };

  const formatPHTime = (dateString: string) => {
    const utcDate = new Date(dateString);
    if (isNaN(utcDate.getTime())) return 'Invalid date';
    const phDate = new Date(utcDate.getTime() + 8 * 60 * 60 * 1000);
    return phDate.toLocaleString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Only update status once when sending a message, not on each input change
  const handleMessageChange = (value: string) => {
    setMessage(value);
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedReport) return;

    setLoading(true);
    setErrorMsg('');

    // Insert new message
    const { error: insertError } = await supabase.from('messages').insert([
      {
        report_id: selectedReport.id,
        sender: 'admin',
        message: message.trim(),
      },
    ]);

    if (insertError) {
      setErrorMsg(insertError.message);
      setLoading(false);
      return;
    }

    // Update report status if it is Pending
    if (selectedReport.status === 'Pending') {
      const { error: updateError } = await supabase
        .from('incident_reports')
        .update({ status: 'In Progress' })
        .eq('id', selectedReport.id);

      if (updateError) {
        setErrorMsg(updateError.message);
        setLoading(false);
        return;
      }

      setReports((prev) =>
        prev.map((r) =>
          r.id === selectedReport.id ? { ...r, status: 'In Progress' } : r
        )
      );
      setSelectedReport((prev) =>
        prev ? { ...prev, status: 'In Progress' } : null
      );
    }

    await fetchMessages(selectedReport.id);
    setMessage('');
    setLoading(false);
  };

  const handleResolveReport = async () => {
    if (!selectedReport) return;

    setLoading(true);
    setErrorMsg('');

    const { error } = await supabase
      .from('incident_reports')
      .update({ status: 'Resolved' })
      .eq('id', selectedReport.id);

    if (error) {
      setErrorMsg(error.message);
    } else {
      setReports((prev) =>
        prev.map((r) =>
          r.id === selectedReport.id ? { ...r, status: 'Resolved' } : r
        )
      );
      setSelectedReport((prev) =>
        prev ? { ...prev, status: 'Resolved' } : null
      );
    }
    setLoading(false);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Admin Dashboard</IonTitle>
          {selectedReport && (
            <IonButtons slot="end">
              <IonButton onClick={() => setSelectedReport(null)}>
                <IonIcon icon={closeOutline} />
              </IonButton>
            </IonButtons>
          )}
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {errorMsg && <IonText color="danger">{errorMsg}</IonText>}

        {loading && <IonSpinner name="dots" />}

        {!selectedReport ? (
          <>
            <IonList>
              {reports.length === 0 ? (
                <IonText>No reports found.</IonText>
              ) : (
                reports.map((report) => (
                  <IonItem
                    key={report.id}
                    button
                    onClick={() => setSelectedReport(report)}
                  >
                    <IonLabel>
                      <h2>{report.title}</h2>
                      <p>
                        <strong>Type:</strong> {report.type} |{' '}
                        <strong>Barangay:</strong> {report.barangay}
                      </p>
                      <p>{report.description}</p>
                      <p>
                        <small>
                          <strong>Date Reported:</strong>{' '}
                          {formatPHTime(report.date_reported)}
                        </small>
                      </p>
                      <p>
                        <small>
                          <strong>User ID:</strong> {report.user_id}
                        </small>
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
                ))
              )}
            </IonList>
          </>
        ) : (
          <>
            <IonText>
              <h2>{selectedReport.title}</h2>
              <p>
                <strong>Type:</strong> {selectedReport.type} |{' '}
                <strong>Barangay:</strong> {selectedReport.barangay}
              </p>
              <p>{selectedReport.description}</p>
              <p>
                <small>
                  <strong>Date Reported:</strong>{' '}
                  {formatPHTime(selectedReport.date_reported)}
                </small>
              </p>
              <p>
                <small>
                  <strong>Status:</strong>{' '}
                  <IonBadge
                    color={
                      selectedReport.status === 'Pending'
                        ? 'warning'
                        : selectedReport.status === 'In Progress'
                        ? 'primary'
                        : selectedReport.status === 'Resolved'
                        ? 'success'
                        : 'medium'
                    }
                  >
                    {selectedReport.status}
                  </IonBadge>
                </small>
              </p>
            </IonText>

<IonList style={{ maxHeight: '300px', overflowY: 'auto' }}>
  {messages.length === 0 ? (
    <IonText>No messages yet.</IonText>
  ) : (
    messages.map((msg) => (
      <IonItem
        key={msg.id}
        lines="none"
        style={{ justifyContent: msg.sender === 'admin' ? 'flex-end' : 'flex-start' }}
      >
        <IonLabel
          style={{
            textAlign: msg.sender === 'admin' ? 'right' : 'left',
            maxWidth: '75%',
          }}
        >
          <p
            style={{
              padding: '8px',
              borderRadius: '10px',
              display: 'inline-block',
              wordBreak: 'break-word',
              backgroundColor: 'transparent', // no background color
              border: '1px solid #ccc', // optional: subtle border for visibility
            }}
          >
            {msg.message}
          </p>
          <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>
            <span style={{ fontWeight: 'bold' }}>
              {msg.sender === 'admin' ? 'You' : 'User'}
            </span>{' '}
            &middot; {formatPHTime(msg.created_at)}
          </div>
        </IonLabel>
      </IonItem>
    ))
  )}
  <div ref={messagesEndRef} />
</IonList>


            <IonTextarea
              placeholder="Type your message here..."
              value={message}
              onIonChange={(e) => handleMessageChange(e.detail.value ?? '')}
              rows={3}
              disabled={loading}
            />

            <IonButton
              expand="block"
              onClick={handleSendMessage}
              disabled={loading || message.trim().length === 0}
              style={{ marginTop: '10px' }}
            >
              Send Message
            </IonButton>

            {selectedReport.status !== 'Resolved' && (
              <IonButton
                expand="block"
                color="success"
                onClick={handleResolveReport}
                disabled={loading}
                style={{ marginTop: '10px' }}
              >
                Mark as Resolved
              </IonButton>
            )}
          </>
        )}
      </IonContent>
    </IonPage>
  );
};

export default AdminDashboard;
