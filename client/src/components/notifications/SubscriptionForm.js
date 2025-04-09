// Updated client/src/components/notifications/SubscriptionForm.js
import React, { useState } from "react";
import styled from "styled-components";
import { toast } from "react-hot-toast";
import { FaBell } from "react-icons/fa";
import { requestNotificationPermission } from "../../utils/oneSignal";

const SubscriptionForm = () => {
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);

    try {
      const result = await requestNotificationPermission();

      if (result) {
        toast.success("Successfully subscribed to notifications!");
      } else {
        toast.info(
          "You can enable notifications anytime in your browser settings."
        );
      }
    } catch (err) {
      console.error("Subscription error:", err);
      toast.error("Failed to subscribe. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormContainer>
      <FormHeader>
        <IconContainer>
          <FaBell />
        </IconContainer>
        <FormTitle>Get Notified</FormTitle>
      </FormHeader>

      <FormDescription>
        Stay updated with new posts and stories by enabling browser
        notifications.
      </FormDescription>

      <SubscribeButton onClick={handleSubscribe} disabled={loading}>
        {loading ? "Processing..." : "Enable Notifications"}
      </SubscribeButton>
    </FormContainer>
  );
};

// Styled components remain mostly the same
const FormContainer = styled.div`
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  max-width: 450px;
  margin: 0 auto;
`;

const FormHeader = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 1.5rem;
  text-align: center;
`;

const IconContainer = styled.div`
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  background-color: #ff7e5f;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  margin-bottom: 1rem;
`;

const FormTitle = styled.h2`
  font-size: 1.5rem;
  color: #333333;
  margin: 0;
`;

const FormDescription = styled.p`
  text-align: center;
  color: #666666;
  margin-bottom: 2rem;
`;

const SubscribeButton = styled.button`
  width: 100%;
  background-color: #ff7e5f;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.875rem;
  font-size: 1rem;
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
`;

export default SubscriptionForm;
