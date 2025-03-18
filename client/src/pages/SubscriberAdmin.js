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

    if (
      !window.confirm(
        `Send this message to ALL active subscribers?\n\n"${customMessage}"`
      )
    ) {
      return;
    }

    try {
      setSendingMessage(true);

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
    try {
      const action = currentStatus ? "deactivate" : "activate";

      if (
        !window.confirm(`Are you sure you want to ${action} this subscriber?`)
      ) {
        return;
      }

      await axios.put(`/api/subscribers/${subscriberId}/toggle-active`);

      // Update local state
      setSubscribers(
        subscribers.map((sub) =>
          sub._id === subscriberId ? { ...sub, isActive: !currentStatus } : sub
        )
      );

      // Update active count
      setActiveSubscribers((prev) => (currentStatus ? prev - 1 : prev + 1));

      toast.success(`Subscriber ${action}d successfully`);
    } catch (err) {
      console.error(
        `Error ${currentStatus ? "deactivating" : "activating"} subscriber:`,
        err
      );
      toast.error("Failed to update subscriber status");
    }
  };

  const handleDeleteSubscriber = async (subscriberId) => {
    try {
      if (
        !window.confirm(
          "Are you sure you want to delete this subscriber permanently? This action cannot be undone."
        )
      ) {
        return;
      }

      await axios.delete(`/api/subscribers/${subscriberId}`);

      // Update local state
      const removedSubscriber = subscribers.find(
        (sub) => sub._id === subscriberId
      );
      setSubscribers(subscribers.filter((sub) => sub._id !== subscriberId));

      // Update active count if the subscriber was active
      if (removedSubscriber && removedSubscriber.isActive) {
        setActiveSubscribers((prev) => prev - 1);
      }

      toast.success("Subscriber deleted successfully");
    } catch (err) {
      console.error("Error deleting subscriber:", err);
      toast.error("Failed to delete subscriber");
    }
  };

  if (!isAuthenticated || !isAdmin) {
    return (
      <Container>
        <AccessDenied>
          <FaBell />
          <h2>Access Denied</h2>
          <p>You must be an admin to view this page.</p>
          <BackLink to="/">Return to Home</BackLink>
        </AccessDenied>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container>
        <LoadingMessage>Loading subscribers...</LoadingMessage>
      </Container>
    );
  }

  return (
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
              <StatIcon>
                <FaUserMinus />
              </StatIcon>
              <StatInfo>
                <StatValue>{subscribers.length - activeSubscribers}</StatValue>
                <StatLabel>Inactive Subscribers</StatLabel>
              </StatInfo>
            </StatCard>

            <StatCard>
              <StatIcon>
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
              <span>{sendingMessage ? "Sending..." : "Send Notification"}</span>
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
                        ? new Date(subscriber.lastNotified).toLocaleDateString()
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
                          onClick={() => handleDeleteSubscriber(subscriber._id)}
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
    </Container>
  );
};

// Styled Components
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
  color: #666666;
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
  color: #333333;
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
  color: #666666;
`;

const ErrorMessage = styled.div`
  background-color: #f8d7da;
  color: #721c24;
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
    color: #333333;
    margin-bottom: 0.5rem;
  }

  p {
    color: #666666;
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
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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
`;

const StatInfo = styled.div`
  flex: 1;
`;

const StatValue = styled.div`
  font-size: 1.75rem;
  font-weight: 700;
  color: #333333;
  margin-bottom: 0.25rem;
`;

const StatLabel = styled.div`
  color: #666666;
  font-size: 0.875rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  color: #333333;
  margin: 2rem 0 1rem;
`;

const NotificationForm = styled.form`
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  margin-bottom: 2rem;
`;

const NotificationInput = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #dddddd;
  border-radius: 4px;
  font-size: 1rem;
  resize: vertical;
  min-height: 100px;
  margin-bottom: 0.5rem;

  &:focus {
    outline: none;
    border-color: #ff7e5f;
  }

  &:disabled {
    background-color: #f5f5f5;
    cursor: not-allowed;
  }
`;

const CharacterCount = styled.div`
  text-align: right;
  font-size: 0.75rem;
  color: #666666;
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
    background-color: #cccccc;
    cursor: not-allowed;
  }

  svg {
    margin-right: 0.5rem;
  }
`;

const EmptyState = styled.div`
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 3rem;
  text-align: center;
  color: #666666;
`;

const SubscriberTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;

  th,
  td {
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid #eeeeee;
  }

  th {
    background-color: #f9f9f9;
    font-weight: 600;
    color: #333333;
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
  background-color: ${(props) => (props.active ? "#e0f7ea" : "#f8d7da")};
  color: ${(props) => (props.active ? "#0d6832" : "#721c24")};
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

export default SubscriberAdmin;
