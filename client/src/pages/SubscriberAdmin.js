import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import axios from "axios";
import { toast } from "react-hot-toast";
import {
  FaArrowLeft,
  FaBell,
  FaDesktop,
  FaMobile,
  FaEnvelope,
  FaInfoCircle,
  FaChartBar,
} from "react-icons/fa";
import { AuthContext } from "../context/AuthContext";

const SubscriberAdmin = () => {
  const [subscriberStats, setSubscriberStats] = useState({
    totalSubscribers: 0,
    lastSent: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notificationTitle, setNotificationTitle] = useState("SoloGram Update");
  const [customMessage, setCustomMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);

  const { isAuthenticated, user } = useContext(AuthContext);
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      return;
    }

    const fetchNotificationStats = async () => {
      try {
        setLoading(true);

        const response = await axios.get("/api/notifications/stats");
        setSubscriberStats(response.data.data);
        setError(null);
      } catch (err) {
        console.error("Error fetching notification stats:", err);
        setError("Failed to load notification statistics. Please try again.");
        toast.error("Failed to load notification statistics");
      } finally {
        setLoading(false);
      }
    };

    fetchNotificationStats();
  }, [isAuthenticated, isAdmin]);

  const handleSendCustomNotification = async (e) => {
    e.preventDefault();

    if (!customMessage.trim()) {
      toast.error("Please enter a message to send");
      return;
    }

    setShowSendModal(true);
  };

  const confirmSendNotification = async () => {
    try {
      setSendingMessage(true);
      setShowSendModal(false);

      const response = await axios.post("/api/notifications/custom", {
        message: customMessage,
        title: notificationTitle,
      });

      toast.success(`Message sent to ${response.data.notified} subscribers`);
      setCustomMessage("");

      // Update stats after sending
      const statsResponse = await axios.get("/api/notifications/stats");
      setSubscriberStats(statsResponse.data.data);
    } catch (err) {
      console.error("Error sending notification:", err);
      toast.error("Failed to send notification");
    } finally {
      setSendingMessage(false);
    }
  };

  if (!isAuthenticated || !isAdmin) {
    return (
      <PageWrapper>
        <Container>
          <AccessDenied>
            <FaBell />
            <h2>Access Denied</h2>
            <p>You must be an admin to view this page.</p>
            <BackLink to="/">Return to Home</BackLink>
          </AccessDenied>
        </Container>
      </PageWrapper>
    );
  }

  if (loading) {
    return (
      <PageWrapper>
        <Container>
          <LoadingMessage>Loading notification dashboard...</LoadingMessage>
        </Container>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <Container>
        <Header>
          <BackLink to="/profile">
            <FaArrowLeft />
            <span>Back to Profile</span>
          </BackLink>

          <PageTitle>
            <FaBell />
            <span>Push Notification Dashboard</span>
          </PageTitle>
        </Header>

        {error ? (
          <ErrorMessage>{error}</ErrorMessage>
        ) : (
          <>
            <StatsContainer>
              <StatCard>
                <StatIcon>
                  <FaDesktop />
                </StatIcon>
                <StatInfo>
                  <StatValue>{subscriberStats.totalSubscribers || 0}</StatValue>
                  <StatLabel>Total Subscribers</StatLabel>
                </StatInfo>
              </StatCard>

              <StatCard>
                <StatIcon className="mobile">
                  <FaMobile />
                </StatIcon>
                <StatInfo>
                  <StatValue>OneSignal</StatValue>
                  <StatLabel>Notification Provider</StatLabel>
                </StatInfo>
              </StatCard>

              <StatCard>
                <StatIcon className="total">
                  <FaChartBar />
                </StatIcon>
                <StatInfo>
                  <StatValue>
                    {subscriberStats.lastSent &&
                    new Date(subscriberStats.lastSent).getFullYear() > 2000
                      ? new Date(subscriberStats.lastSent).toLocaleDateString()
                      : "Never"}
                  </StatValue>
                  <StatLabel>Last Notification Sent</StatLabel>
                </StatInfo>
              </StatCard>
            </StatsContainer>

            <SectionTitle>Send Push Notification</SectionTitle>
            <NotificationForm onSubmit={handleSendCustomNotification}>
              <FormGroup>
                <Label htmlFor="notificationTitle">Notification Title</Label>
                <NotificationTitleInput
                  id="notificationTitle"
                  type="text"
                  placeholder="Enter notification title..."
                  value={notificationTitle}
                  onChange={(e) => setNotificationTitle(e.target.value)}
                  disabled={sendingMessage}
                />
              </FormGroup>

              <FormGroup>
                <Label htmlFor="notificationMessage">
                  Notification Message
                </Label>
                <NotificationInput
                  id="notificationMessage"
                  placeholder="Enter message to send to all subscribers..."
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  disabled={sendingMessage}
                />
                <CharacterCount>
                  {customMessage.length} characters
                  {customMessage.length > 500 &&
                    " (very long messages may be truncated on some devices)"}
                </CharacterCount>
              </FormGroup>

              <InfoPanel>
                <FaInfoCircle />
                <span>
                  This notification will be sent to all users who have
                  subscribed to push notifications. Users can subscribe by
                  clicking the "Allow Notifications" prompt when visiting the
                  site.
                </span>
              </InfoPanel>

              <SendButton
                type="submit"
                disabled={sendingMessage || !customMessage.trim()}
              >
                <FaEnvelope />
                <span>
                  {sendingMessage ? "Sending..." : "Send Notification"}
                </span>
              </SendButton>
            </NotificationForm>

            <SectionTitle>Push Notification Management</SectionTitle>
            <InfoCard>
              <InfoCardHeader>
                <FaInfoCircle />
                <h3>About Push Notifications</h3>
              </InfoCardHeader>
              <InfoCardContent>
                <p>
                  SoloGram uses OneSignal to manage push notifications.
                  Subscribers are automatically managed through the OneSignal
                  service.
                </p>
                <p>
                  To view detailed analytics, subscriber counts, and delivery
                  statistics, please visit the{" "}
                  <a
                    href="https://app.onesignal.com"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    OneSignal Dashboard
                  </a>
                  .
                </p>
                <FeatureList>
                  <FeatureItem>
                    <strong>Segments:</strong> All subscribers are in the "All"
                    segment by default.
                  </FeatureItem>
                  <FeatureItem>
                    <strong>Device Types:</strong> OneSignal tracks desktop and
                    mobile devices automatically.
                  </FeatureItem>
                  <FeatureItem>
                    <strong>Automated Notifications:</strong> New posts and
                    stories automatically trigger notifications.
                  </FeatureItem>
                </FeatureList>
              </InfoCardContent>
            </InfoCard>
          </>
        )}

        {/* Send notification confirmation modal */}
        {showSendModal && (
          <DeleteModal>
            <DeleteModalContent>
              <h3>Send Notification</h3>
              <p>
                Are you sure you want to send this notification to ALL
                subscribers?
              </p>
              <MessagePreview>
                <MessagePreviewTitle>{notificationTitle}</MessagePreviewTitle>
                <MessagePreviewContent>"{customMessage}"</MessagePreviewContent>
              </MessagePreview>
              <DeleteModalButtons>
                <CancelButton onClick={() => setShowSendModal(false)}>
                  Cancel
                </CancelButton>
                <ConfirmActionButton onClick={confirmSendNotification}>
                  Send Notification
                </ConfirmActionButton>
              </DeleteModalButtons>
            </DeleteModalContent>
            <Backdrop onClick={() => setShowSendModal(false)} />
          </DeleteModal>
        )}
      </Container>
    </PageWrapper>
  );
};

// Modified and new styled components

const PageWrapper = styled.div`
  background-color: #121212;
  min-height: 100vh;
  padding: 1rem 0;
`;

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  color: #dddddd;
  text-decoration: none;
  margin-right: 2rem;
  transition: color 0.3s;

  &:hover {
    color: #ff7e5f;
  }

  svg {
    margin-right: 0.5rem;
  }

  @media (max-width: 768px) {
    margin-bottom: 1rem;
  }
`;

const PageTitle = styled.h1`
  display: flex;
  align-items: center;
  font-size: 1.75rem;
  color: #ffffff;
  margin: 0;

  svg {
    color: #ff7e5f;
    margin-right: 0.75rem;
  }
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 4rem 0;
  font-size: 1.125rem;
  color: #aaaaaa;
`;

const ErrorMessage = styled.div`
  background-color: rgba(248, 215, 218, 0.2);
  color: #ff6b6b;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 2rem;
`;

const AccessDenied = styled.div`
  text-align: center;
  padding: 4rem 0;

  svg {
    font-size: 3rem;
    color: #ff7e5f;
    margin-bottom: 1rem;
  }

  h2 {
    font-size: 1.75rem;
    color: #ffffff;
    margin-bottom: 0.5rem;
  }

  p {
    color: #aaaaaa;
    margin-bottom: 1.5rem;
  }
`;

const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2.5rem;
`;

const StatCard = styled.div`
  background-color: #1e1e1e;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  padding: 1.5rem;
  display: flex;
  align-items: center;
`;

const StatIcon = styled.div`
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  background-color: #ff7e5f;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  margin-right: 1rem;

  &.mobile {
    background-color: #4a90e2;
  }

  &.total {
    background-color: #50c878;
  }
`;

const StatInfo = styled.div`
  flex: 1;
`;

const StatValue = styled.div`
  font-size: 1.75rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 0.25rem;
`;

const StatLabel = styled.div`
  color: #aaaaaa;
  font-size: 0.875rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  color: #ffffff;
  margin: 2rem 0 1rem;
`;

const NotificationForm = styled.form`
  background-color: #1e1e1e;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  padding: 1.5rem;
  margin-bottom: 2rem;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #dddddd;
`;

const NotificationTitleInput = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #444444;
  border-radius: 4px;
  font-size: 1rem;
  background-color: #333333;
  color: #ffffff;

  &:focus {
    outline: none;
    border-color: #ff7e5f;
  }

  &:disabled {
    background-color: #272727;
    cursor: not-allowed;
  }

  &::placeholder {
    color: #888888;
  }
`;

const NotificationInput = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #444444;
  border-radius: 4px;
  font-size: 1rem;
  resize: vertical;
  min-height: 100px;
  margin-bottom: 0.5rem;
  background-color: #333333;
  color: #ffffff;

  &:focus {
    outline: none;
    border-color: #ff7e5f;
  }

  &:disabled {
    background-color: #272727;
    cursor: not-allowed;
  }

  &::placeholder {
    color: #888888;
  }
`;

const CharacterCount = styled.div`
  text-align: right;
  font-size: 0.75rem;
  color: #aaaaaa;
  margin-bottom: 1rem;
`;

const InfoPanel = styled.div`
  display: flex;
  align-items: flex-start;
  background-color: rgba(74, 144, 226, 0.1);
  border-left: 3px solid #4a90e2;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1.5rem;

  svg {
    color: #4a90e2;
    margin-right: 0.75rem;
    margin-top: 0.125rem;
    flex-shrink: 0;
  }

  span {
    color: #bbbbbb;
    font-size: 0.875rem;
    line-height: 1.5;
  }
`;

const SendButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #ff7e5f;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: #ff6347;
  }

  &:disabled {
    background-color: #444444;
    cursor: not-allowed;
    color: #888888;
  }

  svg {
    margin-right: 0.5rem;
  }
`;

const InfoCard = styled.div`
  background-color: #1e1e1e;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  overflow: hidden;
`;

const InfoCardHeader = styled.div`
  background-color: #272727;
  padding: 1.25rem;
  display: flex;
  align-items: center;
  border-bottom: 1px solid #333333;

  svg {
    color: #ff7e5f;
    margin-right: 0.75rem;
    font-size: 1.25rem;
  }

  h3 {
    color: #ffffff;
    margin: 0;
    font-size: 1.25rem;
  }
`;

const InfoCardContent = styled.div`
  padding: 1.5rem;
  color: #dddddd;

  p {
    margin-bottom: 1rem;
    line-height: 1.6;
  }

  a {
    color: #ff7e5f;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const FeatureList = styled.ul`
  margin: 1.5rem 0 0.5rem;
  padding-left: 1.5rem;
`;

const FeatureItem = styled.li`
  margin-bottom: 0.75rem;
  line-height: 1.6;

  strong {
    color: #ffffff;
  }
`;

const DeleteModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const DeleteModalContent = styled.div`
  background-color: #1e1e1e;
  border-radius: 8px;
  padding: 2rem;
  width: 90%;
  max-width: 500px;
  z-index: 1001;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);

  h3 {
    color: #ffffff;
    margin-top: 0;
    margin-bottom: 1rem;
  }

  p {
    color: #dddddd;
    margin-bottom: 1.5rem;
  }
`;

const MessagePreview = styled.div`
  background-color: #272727;
  border-radius: 4px;
  margin-bottom: 1.5rem;
  overflow: hidden;
`;

const MessagePreviewTitle = styled.div`
  background-color: #333333;
  color: #ffffff;
  font-weight: 600;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #444444;
`;

const MessagePreviewContent = styled.div`
  padding: 1rem;
  color: #ffffff;
  font-style: italic;
`;

const DeleteModalButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;

  @media (max-width: 480px) {
    flex-direction: column;
  }
`;

const CancelButton = styled.button`
  background-color: #333333;
  color: #dddddd;
  border: none;
  border-radius: 4px;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: #444444;
  }

  @media (max-width: 480px) {
    order: 2;
  }
`;

const ConfirmActionButton = styled.button`
  background-color: #ff7e5f;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: #ff6347;
  }

  @media (max-width: 480px) {
    order: 1;
    margin-bottom: 0.5rem;
  }
`;

const Backdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  z-index: 1000;
`;

export default SubscriberAdmin;
