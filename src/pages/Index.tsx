import { KioskLayout } from '@/components/kiosk/KioskLayout';

// Configure your MQTT broker settings here
const MQTT_CONFIG = {
  brokerUrl: 'ws://localhost:9001', // Your MQTT broker WebSocket URL
  username: undefined as string | undefined, // Set if auth required
  password: undefined as string | undefined, // Set if auth required
  topic: 'posterboy2/poster',
};

const Index = () => {
  return (
    <KioskLayout
      mqttBrokerUrl={MQTT_CONFIG.brokerUrl}
      mqttUsername={MQTT_CONFIG.username}
      mqttPassword={MQTT_CONFIG.password}
      mqttTopic={MQTT_CONFIG.topic}
    />
  );
};

export default Index;
