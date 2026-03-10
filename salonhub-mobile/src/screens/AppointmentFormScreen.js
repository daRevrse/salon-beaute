import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import ActionButton from '../components/ActionButton';

const AppointmentFormScreen = ({ navigation, route }) => {
  const appointmentId = route?.params?.appointmentId;
  const isEditing = !!appointmentId;

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);

  const [formData, setFormData] = useState({
    client_id: '',
    service_id: '',
    employee_id: '',
    appointment_date: '',
    start_time: '',
    notes: '',
  });

  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // Modal states
  const [showClientModal, setShowClientModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [clientsRes, servicesRes, staffRes] = await Promise.all([
        api.get('/clients'),
        api.get('/services'),
        api.get('/auth/staff'),
      ]);

      setClients(clientsRes.data?.data || []);
      setServices(servicesRes.data?.data || []);
      setStaff(staffRes.data?.data || []);

      if (isEditing) {
        await loadAppointment();
      }
    } catch (error) {
      console.error('Erreur chargement données:', error);
      Alert.alert('Erreur', 'Impossible de charger les données');
    } finally {
      setLoading(false);
    }
  };

  const loadAppointment = async () => {
    try {
      const response = await api.get(`/appointments/${appointmentId}`);
      const appointment = response.data?.data;

      if (appointment) {
        setFormData({
          client_id: appointment.client_id,
          service_id: appointment.service_id,
          employee_id: appointment.employee_id || '',
          appointment_date: appointment.appointment_date,
          start_time: appointment.start_time,
          notes: appointment.notes || '',
        });

        setSelectedClient(clients.find(c => c.id === appointment.client_id));
        setSelectedService(services.find(s => s.id === appointment.service_id));
        setSelectedEmployee(staff.find(e => e.id === appointment.employee_id));
      }
    } catch (error) {
      console.error('Erreur chargement rendez-vous:', error);
      Alert.alert('Erreur', 'Impossible de charger le rendez-vous');
    }
  };

  const calculateEndTime = (startTime, durationMinutes) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);

    const endDate = new Date(startDate.getTime() + durationMinutes * 60000);

    const endHours = endDate.getHours().toString().padStart(2, '0');
    const endMinutes = endDate.getMinutes().toString().padStart(2, '0');

    return `${endHours}:${endMinutes}:00`;
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.client_id) {
      Alert.alert('Erreur', 'Veuillez sélectionner un client');
      return;
    }
    if (!formData.service_id) {
      Alert.alert('Erreur', 'Veuillez sélectionner un service');
      return;
    }
    if (!formData.appointment_date) {
      Alert.alert('Erreur', 'Veuillez sélectionner une date');
      return;
    }
    if (!formData.start_time) {
      Alert.alert('Erreur', 'Veuillez sélectionner une heure');
      return;
    }

    // Calculer end_time basé sur la durée du service
    const endTime = calculateEndTime(formData.start_time, selectedService.duration);

    const appointmentData = {
      client_id: formData.client_id,
      service_id: formData.service_id,
      staff_id: formData.employee_id || null,
      appointment_date: formData.appointment_date,
      start_time: formData.start_time,
      end_time: endTime,
      notes: formData.notes || '',
    };

    setSubmitting(true);
    try {
      if (isEditing) {
        await api.put(`/appointments/${appointmentId}`, appointmentData);
        Alert.alert('Succès', 'Rendez-vous modifié avec succès');
      } else {
        await api.post('/appointments', appointmentData);
        Alert.alert('Succès', 'Rendez-vous créé avec succès');
      }
      navigation.goBack();
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Impossible de sauvegarder le rendez-vous';
      Alert.alert('Erreur', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClientSelect = (client) => {
    setSelectedClient(client);
    setFormData({ ...formData, client_id: client.id });
    setShowClientModal(false);
    setSearchQuery('');
  };

  const handleServiceSelect = (service) => {
    setSelectedService(service);
    setFormData({ ...formData, service_id: service.id });
    setShowServiceModal(false);
    setSearchQuery('');
  };

  const handleEmployeeSelect = (employee) => {
    setSelectedEmployee(employee);
    setFormData({ ...formData, employee_id: employee?.id || '' });
    setShowEmployeeModal(false);
    setSearchQuery('');
  };

  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      const dateString = selectedDate.toISOString().split('T')[0];
      setFormData({ ...formData, appointment_date: dateString });
    }
  };

  const handleTimeChange = (event, selectedTime) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (selectedTime) {
      const hours = selectedTime.getHours().toString().padStart(2, '0');
      const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
      const timeString = `${hours}:${minutes}:00`;
      setFormData({ ...formData, start_time: timeString });
    }
  };

  const getFilteredClients = () => {
    if (!searchQuery) return clients;
    const query = searchQuery.toLowerCase();
    return clients.filter(client =>
      `${client.first_name} ${client.last_name}`.toLowerCase().includes(query) ||
      client.email?.toLowerCase().includes(query) ||
      client.phone?.includes(searchQuery)
    );
  };

  const getFilteredServices = () => {
    if (!searchQuery) return services;
    const query = searchQuery.toLowerCase();
    return services.filter(service =>
      service.name.toLowerCase().includes(query) ||
      service.category?.toLowerCase().includes(query)
    );
  };

  const getFilteredEmployees = () => {
    if (!searchQuery) return staff;
    const query = searchQuery.toLowerCase();
    return staff.filter(employee =>
      `${employee.first_name} ${employee.last_name}`.toLowerCase().includes(query)
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditing ? 'Modifier le rendez-vous' : 'Nouveau rendez-vous'}
        </Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.content}>
        {/* Client Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>Client *</Text>
          <TouchableOpacity style={styles.picker} onPress={() => setShowClientModal(true)}>
            <View style={styles.pickerContent}>
              {selectedClient ? (
                <>
                  <View style={styles.clientAvatar}>
                    <Text style={styles.clientAvatarText}>
                      {selectedClient.first_name?.charAt(0)}
                      {selectedClient.last_name?.charAt(0)}
                    </Text>
                  </View>
                  <View style={styles.clientInfo}>
                    <Text style={styles.clientName}>
                      {selectedClient.first_name} {selectedClient.last_name}
                    </Text>
                    {selectedClient.phone && (
                      <Text style={styles.clientPhone}>{selectedClient.phone}</Text>
                    )}
                  </View>
                </>
              ) : (
                <Text style={styles.placeholderText}>Sélectionner un client</Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Service Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>Service *</Text>
          <TouchableOpacity style={styles.picker} onPress={() => setShowServiceModal(true)}>
            <View style={styles.pickerContent}>
              {selectedService ? (
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceName}>{selectedService.name}</Text>
                  <View style={styles.serviceDetails}>
                    <Text style={styles.servicePrice}>{selectedService.price} F CFA</Text>
                    <Text style={styles.serviceDuration}> • {selectedService.duration} min</Text>
                  </View>
                </View>
              ) : (
                <Text style={styles.placeholderText}>Sélectionner un service</Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Employee Selection (Optional) */}
        <View style={styles.section}>
          <Text style={styles.label}>Employé (optionnel)</Text>
          <TouchableOpacity style={styles.picker} onPress={() => setShowEmployeeModal(true)}>
            <View style={styles.pickerContent}>
              {selectedEmployee ? (
                <Text style={styles.selectedText}>
                  {selectedEmployee.first_name} {selectedEmployee.last_name}
                </Text>
              ) : (
                <Text style={styles.placeholderText}>Sélectionner un employé</Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Date Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>Date *</Text>
          <TouchableOpacity style={styles.picker} onPress={() => setShowDatePicker(true)}>
            <View style={styles.pickerContent}>
              <Ionicons name="calendar-outline" size={20} color="#6366F1" />
              {formData.appointment_date ? (
                <Text style={styles.selectedText}>
                  {new Date(formData.appointment_date).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                  })}
                </Text>
              ) : (
                <Text style={styles.placeholderText}>Sélectionner une date</Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Time Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>Heure *</Text>
          <TouchableOpacity style={styles.picker} onPress={() => setShowTimePicker(true)}>
            <View style={styles.pickerContent}>
              <Ionicons name="time-outline" size={20} color="#6366F1" />
              {formData.start_time ? (
                <Text style={styles.selectedText}>{formData.start_time}</Text>
              ) : (
                <Text style={styles.placeholderText}>Sélectionner une heure</Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.label}>Notes (optionnel)</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Ajouter des notes..."
            value={formData.notes}
            onChangeText={(text) => setFormData({ ...formData, notes: text })}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Summary Card */}
        {selectedService && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Résumé</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Durée:</Text>
              <Text style={styles.summaryValue}>{selectedService.duration} minutes</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Prix:</Text>
              <Text style={styles.summaryValuePrice}>{selectedService.price} F CFA</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.footer}>
        <ActionButton
          label="Annuler"
          variant="outline"
          onPress={() => navigation.goBack()}
          disabled={submitting}
        />
        <ActionButton
          label={isEditing ? 'Enregistrer' : 'Créer'}
          variant="primary"
          onPress={handleSubmit}
          loading={submitting}
          disabled={submitting}
        />
      </View>

      {/* Client Picker Modal */}
      <Modal
        visible={showClientModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowClientModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowClientModal(false)}>
              <Ionicons name="close" size={28} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Sélectionner un client</Text>
            <View style={{ width: 28 }} />
          </View>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher par nom, email ou téléphone..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <FlatList
            data={getFilteredClients()}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => handleClientSelect(item)}
              >
                <View style={styles.clientAvatar}>
                  <Text style={styles.clientAvatarText}>
                    {item.first_name?.charAt(0)}{item.last_name?.charAt(0)}
                  </Text>
                </View>
                <View style={styles.modalItemContent}>
                  <Text style={styles.modalItemTitle}>
                    {item.first_name} {item.last_name}
                  </Text>
                  {item.email && <Text style={styles.modalItemSubtitle}>{item.email}</Text>}
                  {item.phone && <Text style={styles.modalItemSubtitle}>{item.phone}</Text>}
                </View>
                {selectedClient?.id === item.id && (
                  <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                )}
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>Aucun client trouvé</Text>
              </View>
            }
          />
        </View>
      </Modal>

      {/* Service Picker Modal */}
      <Modal
        visible={showServiceModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowServiceModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowServiceModal(false)}>
              <Ionicons name="close" size={28} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Sélectionner un service</Text>
            <View style={{ width: 28 }} />
          </View>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher un service..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <FlatList
            data={getFilteredServices()}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => handleServiceSelect(item)}
              >
                <View style={styles.modalItemContent}>
                  <Text style={styles.modalItemTitle}>{item.name}</Text>
                  <View style={styles.serviceMetaRow}>
                    <Text style={styles.serviceMetaPrice}>{item.price} F CFA</Text>
                    <Text style={styles.serviceMetaDuration}> • {item.duration} min</Text>
                  </View>
                  {item.category && (
                    <View style={styles.serviceCategoryBadge}>
                      <Text style={styles.serviceCategoryText}>{item.category}</Text>
                    </View>
                  )}
                </View>
                {selectedService?.id === item.id && (
                  <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                )}
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>Aucun service trouvé</Text>
              </View>
            }
          />
        </View>
      </Modal>

      {/* Employee Picker Modal */}
      <Modal
        visible={showEmployeeModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowEmployeeModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowEmployeeModal(false)}>
              <Ionicons name="close" size={28} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Sélectionner un employé</Text>
            <View style={{ width: 28 }} />
          </View>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher un employé..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <FlatList
            data={[{ id: null, first_name: 'Aucun', last_name: 'employé' }, ...getFilteredEmployees()]}
            keyExtractor={(item, index) => item.id?.toString() || index.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => handleEmployeeSelect(item.id ? item : null)}
              >
                <View style={styles.modalItemContent}>
                  <Text style={styles.modalItemTitle}>
                    {item.first_name} {item.last_name}
                  </Text>
                  {item.email && <Text style={styles.modalItemSubtitle}>{item.email}</Text>}
                </View>
                {((!selectedEmployee && !item.id) || selectedEmployee?.id === item.id) && (
                  <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                )}
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>Aucun employé trouvé</Text>
              </View>
            }
          />
        </View>
      </Modal>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={formData.appointment_date ? new Date(formData.appointment_date) : new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}

      {/* Time Picker */}
      {showTimePicker && (
        <DateTimePicker
          value={formData.start_time ? new Date(`2000-01-01T${formData.start_time}`) : new Date()}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleTimeChange}
          is24Hour={true}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 48,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  pickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  placeholderText: {
    fontSize: 15,
    color: '#9CA3AF',
  },
  selectedText: {
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '500',
  },
  clientAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clientAvatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  clientPhone: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  serviceDetails: {
    flexDirection: 'row',
    marginTop: 2,
  },
  servicePrice: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6366F1',
  },
  serviceDuration: {
    fontSize: 13,
    color: '#6B7280',
  },
  textArea: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontSize: 15,
    color: '#1F2937',
    minHeight: 100,
  },
  summaryCard: {
    backgroundColor: '#EEF2FF',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  summaryValuePrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6366F1',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 48,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalItemContent: {
    flex: 1,
  },
  modalItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  modalItemSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  serviceMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  serviceMetaPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366F1',
  },
  serviceMetaDuration: {
    fontSize: 14,
    color: '#6B7280',
  },
  serviceCategoryBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  serviceCategoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
});

export default AppointmentFormScreen;
