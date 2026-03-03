// navigation/CreateSheet.js
import React from 'react';
import styled from 'styled-components';
import {
  FaCamera,
  FaImages,
  FaLightbulb,
  FaFolderOpen,
  FaBook,
  FaArchive,
} from 'react-icons/fa';
import { COLORS } from '../../theme';
import { fadeIn, slideUp, popIn } from './nav.styles';

const CreateSheet = ({ canCreate, onNavigate, onClose }) => (
  <Backdrop onClick={onClose}>
    <Sheet onClick={(e) => e.stopPropagation()}>
      <Handle />
      <SectionTitle>Create</SectionTitle>
      <Grid>
        <Card
          onClick={() => onNavigate('/create')}
          $color={COLORS.primarySalmon}
        >
          <CardIcon $color={COLORS.primarySalmon}>
            <FaCamera />
          </CardIcon>
          <CardName>Post</CardName>
          <CardSub>Photo or video</CardSub>
        </Card>
        <Card
          onClick={() => onNavigate('/create-story')}
          $color={COLORS.primaryMint}
        >
          <CardIcon $color={COLORS.primaryMint}>
            <FaImages />
          </CardIcon>
          <CardName>Story</CardName>
          <CardSub>Gone in 24h</CardSub>
        </Card>
        <Card
          onClick={() => onNavigate('/thoughts/create')}
          $color={COLORS.primaryBlueGray}
        >
          <CardIcon $color={COLORS.primaryBlueGray}>
            <FaLightbulb />
          </CardIcon>
          <CardName>Thought</CardName>
          <CardSub>What's on your mind</CardSub>
        </Card>
        <Card
          onClick={() => onNavigate('/collections/create')}
          $color={COLORS.accentSalmon}
        >
          <CardIcon $color={COLORS.accentSalmon}>
            <FaFolderOpen />
          </CardIcon>
          <CardName>Collection</CardName>
          <CardSub>Group your posts</CardSub>
        </Card>
      </Grid>

      <Divider />
      <SectionTitle>Browse</SectionTitle>
      <BrowseList>
        <BrowseItem onClick={() => onNavigate('/collections')}>
          <BrowseIcon $color={COLORS.accentSalmon}>
            <FaFolderOpen />
          </BrowseIcon>
          <BrowseText>
            <BrowseName>Collections</BrowseName>
            <BrowseSub>Browse your curated groups</BrowseSub>
          </BrowseText>
        </BrowseItem>
        <BrowseItem onClick={() => onNavigate('/memoirs')}>
          <BrowseIcon $color={COLORS.primaryMint}>
            <FaBook />
          </BrowseIcon>
          <BrowseText>
            <BrowseName>Memoirs</BrowseName>
            <BrowseSub>Monthly life snapshots</BrowseSub>
          </BrowseText>
        </BrowseItem>
        {canCreate && (
          <BrowseItem onClick={() => onNavigate('/story-archive')}>
            <BrowseIcon $color={COLORS.primaryBlueGray}>
              <FaArchive />
            </BrowseIcon>
            <BrowseText>
              <BrowseName>Story Archive</BrowseName>
              <BrowseSub>Your past stories</BrowseSub>
            </BrowseText>
          </BrowseItem>
        )}
      </BrowseList>
    </Sheet>
  </Backdrop>
);

export default CreateSheet;

// Styled Components

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 400;
  background: rgba(0, 0, 0, 0.58);
  backdrop-filter: blur(2px);
  animation: ${fadeIn} 0.1s ease;
  display: flex;
  align-items: flex-end;
  @media (min-width: 960px) {
    align-items: center;
    justify-content: center;
  }
`;

const Sheet = styled.div`
  width: 100%;
  background: ${COLORS.cardBackground};
  border-top-left-radius: 22px;
  border-top-right-radius: 22px;
  border: 1px solid ${COLORS.border};
  border-bottom: none;
  padding: 8px 16px calc(36px + env(safe-area-inset-bottom));
  animation: ${slideUp} 0.22s cubic-bezier(0.34, 1.15, 0.64, 1);
  @media (min-width: 960px) {
    width: auto;
    min-width: 380px;
    max-width: 440px;
    border-radius: 20px;
    border: 1px solid ${COLORS.border};
    padding: 16px 18px 22px;
    animation: ${popIn} 0.18s ease;
  }
`;

const Handle = styled.div`
  width: 34px;
  height: 4px;
  border-radius: 99px;
  background: ${COLORS.border};
  margin: 6px auto 16px;
  @media (min-width: 960px) {
    display: none;
  }
`;

const SectionTitle = styled.p`
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.1px;
  color: ${COLORS.textTertiary};
  margin: 0 0 12px;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
`;

const Card = styled.button`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 3px;
  padding: 15px 14px;
  background: ${COLORS.elevatedBackground};
  border: 1px solid ${COLORS.border};
  border-radius: 14px;
  cursor: pointer;
  text-align: left;
  transition: all 0.13s ease;
  &:hover {
    background: ${COLORS.buttonHover};
    border-color: ${(p) => p.$color}45;
    transform: translateY(-2px);
  }
  &:active {
    transform: scale(0.97);
  }
`;

const CardIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 11px;
  display: grid;
  place-items: center;
  background: ${(p) => p.$color}1a;
  color: ${(p) => p.$color};
  font-size: 1.05rem;
  margin-bottom: 6px;
`;

const CardName = styled.span`
  font-size: 0.88rem;
  font-weight: 700;
  color: ${COLORS.textPrimary};
`;

const CardSub = styled.span`
  font-size: 0.7rem;
  color: ${COLORS.textTertiary};
  line-height: 1.3;
`;

const Divider = styled.hr`
  border: none;
  height: 1px;
  background: ${COLORS.border};
  margin: 14px 0 10px;
`;

const BrowseList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const BrowseItem = styled.button`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px 12px;
  background: none;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  text-align: left;
  transition: background 0.12s;
  &:hover {
    background: ${COLORS.elevatedBackground};
  }
  &:active {
    background: ${COLORS.buttonHover};
  }
`;

const BrowseIcon = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  background: ${(p) => p.$color}18;
  color: ${(p) => p.$color};
  font-size: 0.95rem;
  flex-shrink: 0;
`;

const BrowseText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1px;
`;

const BrowseName = styled.span`
  font-size: 0.9rem;
  font-weight: 600;
  color: ${COLORS.textPrimary};
`;

const BrowseSub = styled.span`
  font-size: 0.72rem;
  color: ${COLORS.textTertiary};
`;
