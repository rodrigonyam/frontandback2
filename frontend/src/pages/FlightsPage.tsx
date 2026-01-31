import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Container, Typography, Box, Grid, Card, CardContent, Divider, Button, CircularProgress, Alert, Stack } from '@mui/material';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import { flightsAPI } from '../services/api';
import { Flight } from '../types';

const FlightsPage: React.FC = () => {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFlights = async () => {
      try {
        setLoading(true);
        // No required params: list all flights
        const response = await flightsAPI.search({ passengers: 1 });
        setFlights(response.data.data?.flights || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching flights:', err);
        setError('Failed to load flights. Please make sure the backend is running.');
      } finally {
        setLoading(false);
      }
    };

    fetchFlights();
  }, []);

  if (loading) {
      return (
          <Container sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
          </Container>
      );
  }

  if (error) {
      return (
          <Container sx={{ py: 8 }}>
              <Alert severity="error">{error}</Alert>
          </Container>
      );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h3" sx={{ mb: 2 }}>
          Flight Booking
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Available flights from our partners
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {flights.map((flight) => (
          <Grid item xs={12} key={flight.id}>
            <Card>
              <CardContent>
                <Grid container alignItems="center" spacing={2}>
                  <Grid item xs={12} md={3}>
                    <Typography variant="h6">{flight.airline}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {flight.flightNumber} • {flight.aircraft}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} md={5}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h5">{new Date(flight.departure.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Typography>
                        <Typography variant="body2" color="text.secondary">{flight.departure.city} ({flight.departure.airport})</Typography>
                      </Box>
                      
                      <Box sx={{ flex: 1, px: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Typography variant="caption" color="text.secondary">{flight.duration}</Typography>
                        <Divider sx={{ width: '100%', my: 1 }}><FlightTakeoffIcon sx={{ transform: 'rotate(90deg)', fontSize: 16 }} /></Divider>
                        <Typography variant="caption" color="text.secondary">{flight.class}</Typography>
                      </Box>
                      
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h5">{new Date(flight.arrival.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Typography>
                        <Typography variant="body2" color="text.secondary">{flight.arrival.city} ({flight.arrival.airport})</Typography>
                      </Box>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} md={2} sx={{ textAlign: 'center' }}>
                     <Typography variant="h5" color="primary.main" fontWeight="bold">
                        {flight.currency} {flight.price}
                     </Typography>
                  </Grid>
                  
                  <Grid item xs={12} md={2}>
                    <Stack spacing={1}>
                      <Button component={RouterLink} to={`/flights/${flight.id}`} variant="outlined" fullWidth>
                        View Details
                      </Button>
                      <Button variant="contained" fullWidth>
                        Book Now
                      </Button>
                    </Stack>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        ))}
        {flights.length === 0 && (
            <Grid item xs={12}>
                <Alert severity="info">No flights found for the default search criteria (JFK -&gt; LHR).</Alert>
            </Grid>
        )}
      </Grid>
    </Container>
  );
};

export default FlightsPage;