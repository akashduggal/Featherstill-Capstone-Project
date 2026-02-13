import { View, Text, Button, StyleSheet } from "react-native";

export default function Dashboard() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Battery Dashboard</Text>

      <Text>Battery Name: Main Battery</Text>
      <Text>Status: Connected</Text>
      <Text>Voltage: 12.6V</Text>
      <Text>Charge: 85%</Text>
      <Text>Recharge Cycles: 120</Text>

      <Button title="View Details" onPress={() => {}} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, marginBottom: 20 },
});