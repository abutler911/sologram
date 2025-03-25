import React, { useState } from "react";
import styled from "styled-components";
import axios from "axios";
import { toast } from "react-hot-toast";
import { FaBell, FaCheck } from "react-icons/fa";

const SubscriptionForm = () => {
  const [step, setStep] = useState("initial"); // initial, phone-entered, verification
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();

    if (!phone || !name) {
      toast.error("Please enter both your name and phone number");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post("/api/subscribers/subscribe", {
        phone,
        name,
      });

      toast.success(response.data.message);
      setStep("verification");
    } catch (err) {
      console.error("Subscription error:", err);

      const errorMessage =
        err.response && err.response.data.message
          ? err.response.data.message
          : "Failed to subscribe. Please try again.";

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();

    if (!verificationCode) {
      toast.error("Please enter the verification code");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post("/api/subscribers/verify", {
        phone,
        code: verificationCode,
      });

      toast.success(response.data.message);
      setStep("success");
    } catch (err) {
      console.error("Verification error:", err);

      const errorMessage =
        err.response && err.response.data.message
          ? err.response.data.message
          : "Failed to verify. Please try again.";

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (loading) return;

    try {
      setLoading(true);

      const response = await axios.post(
        "/api/subscribers/resend-verification",
        {
          phone,
        }
      );

      toast.success(response.data.message);
    } catch (err) {
      console.error("Resend code error:", err);

      const errorMessage =
        err.response && err.response.data.message
          ? err.response.data.message
          : "Failed to resend code. Please try again.";

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep("initial");
    setPhone("");
    setName("");
    setVerificationCode("");
  };

  const formatPhoneForE164 = (phoneNumber) => {
    // Remove any non-digit characters
    let digits = phoneNumber.replace(/\D/g, "");

    // Make sure it has the country code
    if (digits.length === 10) {
      // For US numbers, add +1
      digits = `+1${digits}`;
    } else if (!digits.startsWith("+")) {
      digits = `+${digits}`;
    }

    return digits;
  };

  const handlePhoneChange = (e) => {
    setPhone(formatPhoneForE164(e.target.value));
  };

  return (
    <FormContainer>
      <FormHeader>
        <IconContainer>
          <FaBell />
        </IconContainer>
        <FormTitle>
          {step === "success" ? "Subscription Successful!" : "Get Notified"}
        </FormTitle>
      </FormHeader>

      {step === "initial" && (
        <Form onSubmit={handlePhoneSubmit}>
          <FormGroup>
            <Label htmlFor="name">Your Name</Label>
            <Input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              required
              disabled={loading}
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="phone">Phone Number</Label>
            <PhoneInput
              type="tel"
              id="phone"
              value={phone}
              onChange={handlePhoneChange}
              placeholder="+1 (555) 123-4567"
              required
              disabled={loading}
            />
            <InputHint>
              Enter your phone number in international format (e.g., +1 for US)
            </InputHint>
          </FormGroup>

          <PrivacyText>
            By subscribing, you agree to receive SMS notifications about new
            content. Standard message rates may apply. You can unsubscribe at
            any time.
          </PrivacyText>

          <SubmitButton type="submit" disabled={loading}>
            {loading ? "Processing..." : "Subscribe for Updates"}
          </SubmitButton>
        </Form>
      )}

      {step === "verification" && (
        <Form onSubmit={handleVerifySubmit}>
          <FormGroup>
            <Label htmlFor="code">Verification Code</Label>
            <VerificationInput
              type="text"
              id="code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="Enter 6-digit code"
              maxLength={6}
              required
              disabled={loading}
            />
            <InputHint>Enter the 6-digit code sent to {phone}</InputHint>
          </FormGroup>

          <VerificationActions>
            <ResendButton
              type="button"
              onClick={handleResendCode}
              disabled={loading}
            >
              Resend Code
            </ResendButton>

            <ChangeNumberButton
              type="button"
              onClick={handleReset}
              disabled={loading}
            >
              Change Number
            </ChangeNumberButton>
          </VerificationActions>

          <SubmitButton type="submit" disabled={loading}>
            {loading ? "Verifying..." : "Verify Number"}
          </SubmitButton>
        </Form>
      )}

      {step === "success" && (
        <SuccessContent>
          <SuccessIcon>
            <FaCheck />
          </SuccessIcon>
          <SuccessMessage>
            Your phone number has been verified successfully! You'll now receive
            SMS notifications when new content is posted.
          </SuccessMessage>
          <DoneButton onClick={handleReset}>Done</DoneButton>
        </SuccessContent>
      )}
    </FormContainer>
  );
};

// Styled Components
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

const Form = styled.form`
  display: flex;
  flex-direction: column;
`;

const FormGroup = styled.div`
  margin-bottom: 1.25rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333333;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #dddddd;
  border-radius: 4px;
  font-size: 1rem;
  transition: border-color 0.3s;

  &:focus {
    outline: none;
    border-color: #ff7e5f;
  }

  &:disabled {
    background-color: #f5f5f5;
    cursor: not-allowed;
  }
`;

const PhoneInput = styled(Input)`
  padding-left: 0.75rem;
`;

const VerificationInput = styled(Input)`
  font-size: 1.25rem;
  letter-spacing: 0.25rem;
  text-align: center;
`;

const InputHint = styled.div`
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: #666666;
`;

const VerificationActions = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 1.5rem;
`;

const ResendButton = styled.button`
  background: none;
  border: none;
  color: #ff7e5f;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  padding: 0;

  &:hover {
    text-decoration: underline;
  }

  &:disabled {
    color: #cccccc;
    cursor: not-allowed;
  }
`;

const ChangeNumberButton = styled(ResendButton)`
  color: #666666;

  &:hover {
    color: #333333;
  }
`;

const PrivacyText = styled.p`
  font-size: 0.75rem;
  color: #666666;
  margin-bottom: 1.5rem;
  line-height: 1.5;
`;

const SubmitButton = styled.button`
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

const SuccessContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
`;

const SuccessIcon = styled.div`
  width: 4rem;
  height: 4rem;
  border-radius: 50%;
  background-color: #4bb543;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  margin-bottom: 1.5rem;
`;

const SuccessMessage = styled.p`
  color: #333333;
  line-height: 1.6;
  margin-bottom: 1.5rem;
`;

const DoneButton = styled.button`
  background-color: #ff7e5f;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: #ff6347;
  }
`;

export default SubscriptionForm;
