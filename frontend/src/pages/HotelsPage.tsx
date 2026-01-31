import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Container, Typography, Box, Grid, Card, CardMedia, CardContent, CardActions, Button, Rating, Chip, CircularProgress, Alert } from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { hotelsAPI } from '../services/api';
import { Hotel } from '../types';

const HotelsPage: React.FC = () => {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHotels = async () => {
      try {
        setLoading(true);
        // No required params: list all hotels
        const response = await hotelsAPI.search({ guests: 2, rooms: 1 });
        setHotels(response.data.data?.hotels || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching hotels:', err);
        setError('Failed to load hotels.');
      } finally {
        setLoading(false);
      }
    };

    fetchHotels();
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
          Hotel Booking
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Find comfortable stays for your trip
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {hotels.map((hotel) => (
          <Grid item xs={12} md={6} lg={4} key={hotel.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardMedia
                component="img"
                height="200"
                image={hotel.images[0] || 'https://via.placeholder.com/300x200?text=No+Image'}
                alt={hotel.name}
              />
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography gutterBottom variant="h5" component="h2">
                    {hotel.name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Rating value={hotel.rating} precision={0.5} readOnly size="small" />
                        <Typography variant="caption" sx={{ ml: 0.5 }}>({hotel.rating})</Typography>
                    </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, color: 'text.secondary' }}>
                  <LocationOnIcon fontSize="small" sx={{ mr: 0.5 }} />
                  <Typography variant="body2">
                    {hotel.location.address}, {hotel.location.city}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  {hotel.amenities.slice(0, 3).map((amenity) => (
                    <Chip key={amenity} label={amenity} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                  ))}
                  {hotel.amenities.length > 3 && (
                     <Chip label={`+${hotel.amenities.length - 3} more`} size="small" variant="outlined" />
                  )}
                </Box>

                <Typography variant="h6" color="primary">
                  {hotel.currency || '$'} {hotel.pricePerNight || (hotel.roomTypes[0] ? hotel.roomTypes[0].price : 'N/A')}
                  <Typography component="span" variant="body2" color="text.secondary"> / night</Typography>
                </Typography>
              </CardContent>
              <CardActions>
                <Button size="large" fullWidth variant="outlined" component={RouterLink} to={`/hotels/${hotel.id}`}>
                  View Details
                </Button>
                <Button size="large" fullWidth variant="contained">Book Now</Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
         {hotels.length === 0 && (
            <Grid item xs={12}>
                <Alert severity="info">No hotels found for the default search criteria.</Alert>
            </Grid>
        )}
      </Grid>
    </Container>
  );
};

export default HotelsPage;