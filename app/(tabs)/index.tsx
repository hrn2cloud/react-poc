import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../components/AuthContext';
import storesConfig from '../../constants/stores.config.json';

const stores: Store[] = storesConfig;
type Store = {
  id: string;
  name: string;
  employeeId: string;
  accessToken: string;
};

type LineItem = {
  id: string;
  name: string;
  price: number;
  note?: string;
  printed: boolean;
};

type Order = {
  id: string;
  title: string;
  total: number;
  paymentState: string;
  note?: string;
  lineItems?: { elements: LineItem[] };
  createdTime: number;
};

const orderStates = [
  { label: 'All', value: '' },
  { label: 'Open', value: '&filter=state%3Dopen' }
];

export default function HomeScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [selectedState, setSelectedState] = useState<string>('');
  const { user } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!user) {
      setTimeout(() => {
        router.replace('/login');
      }, 0);
    }
  }, [user]);

  useEffect(() => {
    if (!selectedStore) return;
    setLoading(true);
    const url = `https://api.clover.com/v3/merchants/${selectedStore.id}/orders?filter=employee.id%3D${selectedStore.employeeId}&expand=lineItems${selectedState}`;
    fetch(url, {
      headers: {
        accept: 'application/json',
        authorization: `Bearer ${selectedStore.accessToken}`,
      },
    })
      .then((response) => response.json())
      .then((json) => setOrders(json.elements || []))
      .catch((error) => console.error(error))
      .finally(() => setLoading(false));
  }, [selectedStore, selectedState]);

  const renderLineItem = ({ item }: { item: LineItem }) => (
    <View style={styles.lineItemRow}>
      <Text style={styles.cell}>{item.name}</Text>
      <Text style={styles.cell}>${(item.price / 100).toFixed(2)}</Text>
      {item.printed ? (
      <Text style={styles.cell}>Yes</Text>
    ) : (
      <Text style={[styles.cell, styles.noPrinted]}>No</Text>
    )}
    </View>
  );

  const renderOrder = ({ item }: { item: Order }) => {
    let createdDisplay = new Date(item.createdTime).toLocaleString('en-US', {
        timeZone: 'America/Chicago',
    });
    
    return (
    <View style={styles.orderContainer}>
      <Text style={styles.orderTitle}>Order ID: {item.id}</Text>
      <Text>Title: {item.title}</Text>
      <Text>Total: ${(item.total / 100).toFixed(2)}</Text>
      <Text>Payment State: {item.paymentState}</Text>
      <Text>Note: {item.note}</Text>
        <Text>Created Date: {createdDisplay}</Text>
      <Text style={styles.lineItemsHeader}>Line Items:</Text>
      <View style={styles.lineItemHeaderRow}>
        <Text style={styles.headerCell}>Name</Text>
        <Text style={styles.headerCell}>Price</Text>
        <Text style={styles.headerCell}>Printed</Text>
      </View>
      <FlatList
        data={item.lineItems?.elements || []}
        keyExtractor={(li) => li.id}
        renderItem={renderLineItem}
      />
    </View>
  );
  };

  return (
  <View style={styles.container}>
    <Text style={styles.title}>Orders</Text>
    <View style={styles.row}>
      <Text style={styles.label}>Select Store:</Text>
      <Picker
        selectedValue={selectedStore?.id}
        onValueChange={(storeId) => {
          const store = stores.find(s => s.id === storeId) || null;
          setSelectedStore(store);
        }}
        style={styles.picker}
      >
        <Picker.Item label="Select Store" value={null} />
        {stores.map((store) => (
          <Picker.Item key={store.id} label={store.name} value={store.id} />
        ))}
      </Picker>
    </View>
    <View style={styles.row}>
      <Text style={styles.label}>Order State:</Text>
      <Picker
        selectedValue={selectedState}
        onValueChange={(value) => setSelectedState(value)}
        style={styles.picker}
      >
        {orderStates.map((state) => (
          <Picker.Item key={state.label} label={state.label} value={state.value} />
        ))}
      </Picker>
    </View>
    {loading ? (
      <ActivityIndicator />
    ) : (
      <FlatList
        data={orders}
        keyExtractor={(order) => order.id}
        renderItem={renderOrder}
      />
    )}
  </View>
);
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, marginTop: 40, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, color: '#222' },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  label: { fontWeight: 'bold', color: '#222', marginRight: 8 },
  picker: { width: 100, height: 40 },
  orderContainer: { marginBottom: 32, padding: 12, borderWidth: 1, borderRadius: 8, borderColor: '#ccc', backgroundColor: '#f9f9f9' },
  orderTitle: { fontWeight: 'bold', fontSize: 16, marginBottom: 4, color: '#222' },
  lineItemsHeader: { marginTop: 8, fontWeight: 'bold', color: '#222' },
  lineItemHeaderRow: { flexDirection: 'row', borderBottomWidth: 1, paddingBottom: 4, marginTop: 4, borderColor: '#ccc' },
  headerCell: { flex: 1, fontWeight: 'bold', color: '#222' },
  lineItemRow: { flexDirection: 'row', paddingVertical: 4, borderBottomWidth: 0.5, borderColor: '#eee' },
  cell: { flex: 1, color: '#222' },
  noPrinted: { color: 'red', fontWeight: 'bold' },
});