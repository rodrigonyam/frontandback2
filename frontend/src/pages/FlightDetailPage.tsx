import React, { useEffect, useState } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { Container, Typography, Box, Card, CardContent, Divider, Grid, Button, CircularProgress, Alert } from '@mui/material';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import FlightLandIcon from '@mui/icons-material/FlightLand';
import { flightsAPI } from '../services/api';
import { Flight } from '../types';

const FlightDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [flight, setFlight] = useState<Flight | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadFlight = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const res = await flightsAPI.getById(id);
        setFlight(res.data.data?.flight || null);
        setError(null);
      } catch (err) {
        console.error('Flight detail error:', err);
        setError('Unable to load flight details.');
      } finally {
        setLoading(false);
      }
    };

    loadFlight();
  }, [id]);

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error || !flight) {
    return (
      <Container sx={{ py: 8 }}>
        <Alert severity="error">{error || 'Flight not found.'}</Alert>
        <Button sx={{ mt: 2 }} component={RouterLink} to="/flights" variant="outlined">Back to flights</Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Button component={RouterLink} to="/flights" variant="text" sx={{ mb: 2 }}>
        ← Back to flights
      </Button>

      <Card>
        <CardContent>
          <Typography variant="h4" sx={{ mb: 2 }}>
            {flight.airline} {flight.flightNumber}
          </Typography>

          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={5}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <FlightTakeoffIcon color="primary" />
                <Box>
                  <Typography variant="h6">Departure</Typography>
                  <Typography>{flight.departure.city} ({flight.departure.airport})</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {new Date(flight.departure.date).toLocaleString()}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} md={2}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2" color="text.secondary" align="center">{flight.duration}</Typography>
              <Divider sx={{ my: 2 }} />
            </Grid>

            <Grid item xs={12} md={5}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <FlightLandIcon color="primary" />
                <Box>
                  <Typography variant="h6">Arrival</Typography>
                  <Typography>{flight.arrival.city} ({flight.arrival.airport})</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {new Date(flight.arrival.date).toLocaleString()}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>
              <Typography variant="subtitle2" color="text.secondary">Class</Typography>
              <Typography>{flight.class}</Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="subtitle2" color="text.secondary">Price</Typography>
              <Typography color="primary">{flight.currency} {flight.price}</Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="subtitle2" color="text.secondary">Seats</Typography>
              <Typography>{flight.availableSeats}</Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="subtitle2" color="text.secondary">Aircraft</Typography>
              <Typography>{flight.aircraft}</Typography>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />
          <Button variant="contained" fullWidth>Book this flight</Button>
        </CardContent>
      </Card>
    </Container>
  );
};

export default FlightDetailPage;
