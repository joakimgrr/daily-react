/// <reference types="@types/jest" />

import DailyIframe, {
  DailyCall,
  DailyEvent,
  DailyEventObjectMeetingSessionStateUpdated,
  DailyEventObjectNoPayload,
  DailyEventObjectParticipants,
} from '@daily-co/daily-js';
import { act, renderHook } from '@testing-library/react-hooks';
import React from 'react';

import { DailyProvider } from '../../src/DailyProvider';
import { useMeetingSessionState } from '../../src/hooks/useMeetingSessionState';
import { mockParticipant } from '../.test-utils/mocks';

jest.mock('../../src/DailyDevices', () => ({
  ...jest.requireActual('../../src/DailyDevices'),
  DailyDevices: (({ children }) => <>{children}</>) as React.FC,
}));
jest.mock('../../src/DailyLiveStreaming', () => ({
  ...jest.requireActual('../../src/DailyLiveStreaming'),
  DailyLiveStreaming: (({ children }) => <>{children}</>) as React.FC,
}));
jest.mock('../../src/DailyParticipants', () => ({
  ...jest.requireActual('../../src/DailyParticipants'),
  DailyParticipants: (({ children }) => <>{children}</>) as React.FC,
}));
jest.mock('../../src/DailyRecordings', () => ({
  ...jest.requireActual('../../src/DailyRecordings'),
  DailyRecordings: (({ children }) => <>{children}</>) as React.FC,
}));

const createWrapper =
  (callObject: DailyCall = DailyIframe.createCallObject()): React.FC =>
  ({ children }) =>
    <DailyProvider callObject={callObject}>{children}</DailyProvider>;

describe('useMeetingSessionState', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('initially returns undefined', async () => {
    const daily = DailyIframe.createCallObject();
    const { result, waitFor } = renderHook(() => useMeetingSessionState(), {
      wrapper: createWrapper(daily),
    });
    await waitFor(() => {
      expect(result.current.data).toBeUndefined();
      expect(result.current.topology).toEqual('none');
    });
  });
  it('emitted Daily event "joined-meeting" correctly updates the meeting session state', async () => {
    const daily = DailyIframe.createCallObject();
    (daily.meetingSessionState as jest.Mock).mockImplementation(() => ({
      data: {},
      topology: 'peer',
    }));
    const { result, waitFor } = renderHook(() => useMeetingSessionState(), {
      wrapper: createWrapper(daily),
    });
    const event: DailyEvent = 'joined-meeting';
    const payload: DailyEventObjectParticipants = {
      action: 'joined-meeting',
      participants: {
        local: mockParticipant({
          local: true,
        }),
      },
    };
    act(() => {
      // @ts-ignore
      daily.emit(event, payload);
    });
    await waitFor(() => {
      expect(result.current.data).toEqual({});
      expect(result.current.topology).toEqual('peer');
    });
  });
  it('emitted Daily event "meeting-session-state-updated" correctly updates the meeting session state', async () => {
    const daily = DailyIframe.createCallObject();
    const { result, waitFor } = renderHook(() => useMeetingSessionState(), {
      wrapper: createWrapper(daily),
    });
    const event: DailyEvent = 'meeting-session-state-updated';
    const payload: DailyEventObjectMeetingSessionStateUpdated = {
      action: 'meeting-session-state-updated',
      meetingSessionState: {
        data: {
          a: 'b',
        },
        topology: 'peer',
      },
    };
    act(() => {
      // @ts-ignore
      daily.emit(event, payload);
    });
    await waitFor(() => {
      expect(result.current.data).toEqual(payload.meetingSessionState.data);
      expect(result.current.topology).toEqual(
        payload.meetingSessionState.topology
      );
    });
  });
  it('emitted Daily event "left-meeting" resets the meeting session state', async () => {
    const daily = DailyIframe.createCallObject();
    const { result, waitFor } = renderHook(() => useMeetingSessionState(), {
      wrapper: createWrapper(daily),
    });
    const event: DailyEvent = 'meeting-session-state-updated';
    const payload: DailyEventObjectMeetingSessionStateUpdated = {
      action: 'meeting-session-state-updated',
      meetingSessionState: {
        data: {
          a: 'b',
        },
        topology: 'peer',
      },
    };
    act(() => {
      // @ts-ignore
      daily.emit(event, payload);
    });
    await waitFor(() => {
      expect(result.current.data).toEqual(payload.meetingSessionState.data);
      expect(result.current.topology).toEqual(
        payload.meetingSessionState.topology
      );
    });
    const leftEvent: DailyEvent = 'left-meeting';
    const leftPayload: DailyEventObjectNoPayload = {
      action: 'left-meeting',
    };
    act(() => {
      // @ts-ignore
      daily.emit(leftEvent, leftPayload);
    });
    await waitFor(() => {
      expect(result.current.data).toBeUndefined();
      expect(result.current.topology).toEqual('none');
    });
  });
});
