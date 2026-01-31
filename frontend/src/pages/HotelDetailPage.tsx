import React, { useEffect, useState } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { Container, Typography, Box, Card, CardContent, CardMedia, Grid, Chip, Button, CircularProgress, Alert, Rating } from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { hotelsAPI } from '../services/api';
import { Hotel } from '../types';

const HotelDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadHotel = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const res = await hotelsAPI.getById(id);
        setHotel(res.data.data?.hotel || null);
        setError(null);
      } catch (err) {
        console.error('Hotel detail error:', err);
        setError('Unable to load hotel details.');
      } finally {
        setLoading(false);
      }
    };

    loadHotel();
  }, [id]);

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error || !hotel) {
    return (
      <Container sx={{ py: 8 }}>
        <Alert severity="error">{error || 'Hotel not found.'}</Alert>
        <Button sx={{ mt: 2 }} component={RouterLink} to="/hotels" variant="outlined">Back to hotels</Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Button component={RouterLink} to="/hotels" variant="text" sx={{ mb: 2 }}>
        ← Back to hotels
      </Button>

      <Card>
        <CardMedia
          component="img"
          height="260"
          image={hotel.images[0] || 'https://via.placeholder.com/800x260?text=Hotel'}
          alt={hotel.name}
        />
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
            <Typography variant="h4">{hotel.name}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Rating value={hotel.rating} precision={0.5} readOnly />
              <Typography variant="body2" color="text.secondary">({hotel.rating})</Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, color: 'text.secondary' }}>
            <LocationOnIcon fontSize="small" sx={{ mr: 0.5 }} />
            <Typography variant="body2">{hotel.location.address}, {hotel.location.city}</Typography>
          </Box>

          <Box sx={{ mb: 2 }}>
            {hotel.amenities.slice(0, 6).map((amenity) => (
              <Chip key={amenity} label={amenity} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
            ))}
            {hotel.amenities.length > 6 && (
              <Chip label={`+${hotel.amenities.length - 6} more`} size="small" variant="outlined" />
            )}
          </Box>

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={6} md={4}>
              <Typography variant="subtitle2" color="text.secondary">Check-in</Typography>
              <Typography>{new Date(hotel.checkIn).toLocaleDateString()}</Typography>
            </Grid>
            <Grid item xs={6} md={4}>
              <Typography variant="subtitle2" color="text.secondary">Check-out</Typography>
              <Typography>{new Date(hotel.checkOut).toLocaleDateString()}</Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" color="text.secondary">From</Typography>
              <Typography color="primary">{hotel.currency || '$'} {hotel.pricePerNight}</Typography>
            </Grid>
          </Grid>

          <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Room Types</Typography>
          <Grid container spacing={2}>
            {hotel.roomTypes.map((room) => (
              <Grid item xs={12} md={6} key={room.type}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1">{room.type}</Typography>
                    <Typography color="primary">{room.currency} {room.price} / night</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {room.description}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">Max {room.maxGuests} guests</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Button variant="contained" fullWidth sx={{ mt: 3 }}>Book this hotel</Button>
        </CardContent>
      </Card>
    </Container>
  );
};

export default HotelDetailPage;
