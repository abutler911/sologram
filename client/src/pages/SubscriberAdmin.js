// pages/SubscriberAdmin.js
import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import axios from "axios";
import { toast } from "react-hot-toast";
import {
  FaArrowLeft,
  FaBell,
  FaUserPlus,
  FaUserMinus,
  FaUserCheck,
  FaEnvelope,
  FaTrash,
} from "react-icons/fa";
import { AuthContext } from "../context/AuthContext";

const SubscriberAdmin = () => {
  const [subscribers, setSubscribers] = useState([]);
  const [activeSubscribers, setActiveSubscribers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [customMessage, setCustomMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [subscriberToDelete, setSubscriberToDelete] = useState(null);
  const [showToggleModal, setShowToggleModal] = useState(false);
  const [subscriberToToggle, setSubscriberToToggle] = useState(null);
  const [showSendModal, setShowSendModal] = useState(false);

  const { isAuthenticated, user } = useContext(AuthContext);
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      return;
    }

    const fetchSubscribers = async () => {
      try {
        setLoading(true);

        const response = await axios.get("/api/subscribers");
        const subscriberData = response.data.data;

        setSubscribers(subscriberData);
        setActiveSubscribers(subscriberData.filter((s) => s.isActive).length);
        setError(null);
      } catch (err) {
        console.error("Error fetching subscribers:", err);
        setError("Failed to load subscribers. Please try again.");
        toast.error("Failed to load subscribers");
      } finally {
        setLoading(false);
      }
    };

    fetchSubscribers();
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
      });

      toast.success(`Message sent to ${response.data.notified} subscribers`);
      setCustomMessage("");
    } catch (err) {
      console.error("Error sending notification:", err);
      toast.error("Failed to send notification");
    } finally {
      setSendingMessage(false);
    }
  };

  const handleToggleActive = async (subscriberId, currentStatus) => {
    setSubscriberToToggle({ id: subscriberId, status: currentStatus });
    setShowToggleModal(true);
  };

  const confirmToggleActive = async () => {
    try {
      const { id, status } = subscriberToToggle;

      await axios.put(`/api/subscribers/${id}/toggle-active`);

      // Update local state
      setSubscribers(
        subscribers.map((sub) =>
          sub._id === id ? { ...sub, isActive: !status } : sub
        )
      );

      // Update active count
      setActiveSubscribers((prev) => (status ? prev - 1 : prev + 1));

      toast.success(
        `Subscriber ${status ? "deactivated" : "activated"} successfully`
      );
      setShowToggleModal(false);
      setSubscriberToToggle(null);
    } catch (err) {
      console.error(`Error toggling subscriber status:`, err);
      toast.error("Failed to update subscriber status");
      setShowToggleModal(false);
      setSubscriberToToggle(null);
    }
  };

  const handleDeleteSubscriber = async (subscriberId) => {
    setSubscriberToDelete(subscriberId);
    setShowDeleteModal(true);
  };

  const confirmDeleteSubscriber = async () => {
    try {
      await axios.delete(`/api/subscribers/${subscriberToDelete}`);

      // Update local state
      const removedSubscriber = subscribers.find(
        (sub) => sub._id === subscriberToDelete
      );
      setSubscribers(
        subscribers.filter((sub) => sub._id !== subscriberToDelete)
      );

      // Update active count if the subscriber was active
      if (removedSubscriber && removedSubscriber.isActive) {
        setActiveSubscribers((prev) => prev - 1);
      }

      toast.success("Subscriber deleted successfully");
      setShowDeleteModal(false);
      setSubscriberToDelete(null);
    } catch (err) {
      console.error("Error deleting subscriber:", err);
      toast.error("Failed to delete subscriber");
      setShowDeleteModal(false);
      setSubscriberToDelete(null);
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
          <LoadingMessage>Loading subscribers...</LoadingMessage>
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
            <span>Notification Subscribers</span>
          </PageTitle>
        </Header>

        {error ? (
          <ErrorMessage>{error}</ErrorMessage>
        ) : (
          <>
            <StatsContainer>
              <StatCard>
                <StatIcon>
                  <FaUserCheck />
                </StatIcon>
                <StatInfo>
                  <StatValue>{activeSubscribers}</StatValue>
                  <StatLabel>Active Subscribers</StatLabel>
                </StatInfo>
              </StatCard>

              <StatCard>
                <StatIcon className="inactive">
                  <FaUserMinus />
                </StatIcon>
                <StatInfo>
                  <StatValue>
                    {subscribers.length - activeSubscribers}
                  </StatValue>
                  <StatLabel>Inactive Subscribers</StatLabel>
                </StatInfo>
              </StatCard>

              <StatCard>
                <StatIcon className="total">
                  <FaUserPlus />
                </StatIcon>
                <StatInfo>
                  <StatValue>{subscribers.length}</StatValue>
                  <StatLabel>Total Subscribers</StatLabel>
                </StatInfo>
              </StatCard>
            </StatsContainer>

            <SectionTitle>Send Custom Notification</SectionTitle>
            <NotificationForm onSubmit={handleSendCustomNotification}>
              <NotificationInput
                placeholder="Enter message to send to all active subscribers..."
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                disabled={sendingMessage}
                maxLength={160}
              />
              <CharacterCount>
                {customMessage.length}/160 characters
              </CharacterCount>
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

            <SectionTitle>Subscriber List</SectionTitle>
            {subscribers.length === 0 ? (
              <EmptyState>
                <p>No subscribers yet</p>
              </EmptyState>
            ) : (
              <SubscriberTable>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Last Notified</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subscribers.map((subscriber) => (
                    <tr key={subscriber._id}>
                      <td>{subscriber.name}</td>
                      <td>{subscriber.phone}</td>
                      <td>
                        <StatusBadge active={subscriber.isActive}>
                          {subscriber.isActive ? "Active" : "Inactive"}
                        </StatusBadge>
                      </td>
                      <td>
                        {subscriber.lastNotified
                          ? new Date(
                              subscriber.lastNotified
                            ).toLocaleDateString()
                          : "Never"}
                      </td>
                      <td>
                        {new Date(subscriber.createdAt).toLocaleDateString()}
                      </td>
                      <td>
                        <ActionButtons>
                          <ActionButton
                            title={
                              subscriber.isActive ? "Deactivate" : "Activate"
                            }
                            onClick={() =>
                              handleToggleActive(
                                subscriber._id,
                                subscriber.isActive
                              )
                            }
                            className={
                              subscriber.isActive ? "deactivate" : "activate"
                            }
                          >
                            {subscriber.isActive ? (
                              <FaUserMinus />
                            ) : (
                              <FaUserCheck />
                            )}
                          </ActionButton>

                          <ActionButton
                            title="Delete permanently"
                            onClick={() =>
                              handleDeleteSubscriber(subscriber._id)
                            }
                            className="delete"
                          >
                            <FaTrash />
                          </ActionButton>
                        </ActionButtons>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </SubscriberTable>
            )}
          </>
        )}

        {/* Delete confirmation modal */}
        {showDeleteModal && (
          <DeleteModal>
            <DeleteModalContent>
              <h3>Delete Subscriber</h3>
              <p>
                Are you sure you want to delete this subscriber permanently?
                This action cannot be undone.
              </p>
              <DeleteModalButtons>
                <CancelButton onClick={() => setShowDeleteModal(false)}>
                  Cancel
                </CancelButton>
                <ConfirmDeleteButton onClick={confirmDeleteSubscriber}>
                  Delete Subscriber
                </ConfirmDeleteButton>
              </DeleteModalButtons>
            </DeleteModalContent>
            <Backdrop onClick={() => setShowDeleteModal(false)} />
          </DeleteModal>
        )}

        {/* Toggle status confirmation modal */}
        {showToggleModal && subscriberToToggle && (
          <DeleteModal>
            <DeleteModalContent>
              <h3>
                {subscriberToToggle.status ? "Deactivate" : "Activate"}{" "}
                Subscriber
              </h3>
              <p>
                Are you sure you want to{" "}
                {subscriberToToggle.status ? "deactivate" : "activate"} this
                subscriber?
              </p>
              <DeleteModalButtons>
                <CancelButton onClick={() => setShowToggleModal(false)}>
                  Cancel
                </CancelButton>
                <ConfirmActionButton onClick={confirmToggleActive}>
                  {subscriberToToggle.status ? "Deactivate" : "Activate"}{" "}
                  Subscriber
                </ConfirmActionButton>
              </DeleteModalButtons>
            </DeleteModalContent>
            <Backdrop onClick={() => setShowToggleModal(false)} />
          </DeleteModal>
        )}

        {/* Send notification confirmation modal */}
        {showSendModal && (
          <DeleteModal>
            <DeleteModalContent>
              <h3>Send Notification</h3>
              <p>
                Are you sure you want to send this message to ALL active
                subscribers?
              </p>
              <MessagePreview>"{customMessage}"</MessagePreview>
              <DeleteModalButtons>
                <CancelButton onClick={() => setShowSendModal(false)}>
                  Cancel
                </CancelButton>
                <ConfirmActionButton onClick={confirmSendNotification}>
                  Send Message
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

// Styled Components
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

  &.inactive {
    background-color: #ffc107;
  }

  &.total {
    background-color: #4a90e2;
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

const EmptyState = styled.div`
  background-color: #1e1e1e;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  padding: 3rem;
  text-align: center;
  color: #aaaaaa;
`;

const SubscriberTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  background-color: #1e1e1e;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  overflow: hidden;

  th,
  td {
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid #333333;
    color: #dddddd;
  }

  th {
    background-color: #272727;
    font-weight: 600;
    color: #ffffff;
  }

  tr:last-child td {
    border-bottom: none;
  }

  @media (max-width: 1024px) {
    display: block;
    overflow-x: auto;
  }
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 16px;
  font-size: 0.75rem;
  font-weight: 600;
  background-color: ${(props) =>
    props.active ? "rgba(0, 200, 83, 0.2)" : "rgba(255, 69, 58, 0.2)"};
  color: ${(props) => (props.active ? "#22c55e" : "#ff453a")};
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ActionButton = styled.button`
  width: 2rem;
  height: 2rem;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  color: white;
  transition: background-color 0.3s;

  &.activate {
    background-color: #28a745;

    &:hover {
      background-color: #218838;
    }
  }

  &.deactivate {
    background-color: #ffc107;

    &:hover {
      background-color: #e0a800;
    }
  }

  &.delete {
    background-color: #dc3545;

    &:hover {
      background-color: #c82333;
    }
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
  padding: 1rem;
  background-color: #272727;
  border-radius: 4px;
  color: #ffffff;
  margin-bottom: 1.5rem;
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

const ConfirmDeleteButton = styled.button`
  background-color: #e74c3c;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: #c0392b;
  }

  @media (max-width: 480px) {
    order: 1;
    margin-bottom: 0.5rem;
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
