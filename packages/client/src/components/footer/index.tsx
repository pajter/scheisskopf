import React from 'react';

import { useSelector } from '../../redux/hooks';

export function Footer() {
  const session = useSelector((state) => state.client.session);

  const stateRoom = useSelector((state) => state.room);

  const [notify, setNotify] = React.useState(false);
  const timeout = React.useRef<ReturnType<typeof setTimeout>>();

  const isPlaying =
    stateRoom &&
    session &&
    stateRoom?.currentPlayerUserId === session?.userId &&
    (stateRoom.state === 'playing' || stateRoom.state === 'pre-game');

  React.useEffect(() => {
    if (!isPlaying) {
      setNotify(false);
    }
    if (timeout.current && !isPlaying) {
      clearTimeout(timeout.current);
    }
    if (isPlaying) {
      timeout.current = setTimeout(() => {
        setNotify(true);
      }, 1000);
    }
  }, [isPlaying]);

  if (notify) {
    return (
      <div className="footer">
        <div className="notify">🚨 DEBIS 🚨</div>
      </div>
    );
  }

  return null;
}
