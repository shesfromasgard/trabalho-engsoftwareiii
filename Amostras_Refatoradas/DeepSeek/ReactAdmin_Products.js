import React, { useState } from "react";
import { useParams } from "react-router-dom";
import {
  Grid,
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  IconButton,
  Card,
  CardActionArea,
  CardActions,
  CardContent,
  CardMedia,
} from "@mui/material";
import {
  Star as StarIcon,
  StarBorder as StarOutlinedIcon,
  ShoppingCart as ShoppingCartIcon,
  Facebook as FacebookIcon,
  Instagram as InstagramIcon,
  Twitter as TwitterIcon,
} from "@mui/icons-material";
import { yellow } from "@mui/material/colors";
import useStyles from "./styles";
import Widget from "../../components/Widget";
import PageTitle from "../../components/PageTitle";
import { Typography, Link, Button } from "../../components/Wrappers";

import img1 from "../../images/product/img1.jpg";
import img2 from "../../images/product/img2.jpg";
import img3 from "../../images/product/img3.jpg";
import img4 from "../../images/product/img4.jpg";
import img5 from "../../images/product/img5.jpeg";
import img6 from "../../images/product/img6.jpg";
import payment1 from "../../images/product/mastercard.svg";
import payment2 from "../../images/product/paypal.svg";
import payment3 from "../../images/product/visa.svg";
import payment4 from "../../images/product/aexpress.svg";

export const rows = [
  {
    id: 1,
    img: img1,
    title: "Trainers",
    subtitle: "Trainers In White",
    price: 76,
    rating: 4.6,
    color: "primary",
    status: "Shipped",
    process: "64%",
  },
  {
    id: 2,
    img: img2,
    title: "Boots",
    subtitle: "Trainers In Blue",
    price: 37,
    rating: 4.6,
    color: "success",
    status: "Delivered",
    process: "100%",
  },
  {
    id: 3,
    img: img3,
    title: "Flat sandals",
    subtitle: "Trainers In White",
    price: 70,
    rating: 4.6,
    color: "secondary",
    status: "Canceled",
    process: "0%",
  },
  {
    id: 4,
    img: img4,
    title: "Trainers",
    subtitle: "Trainers In Blue",
    price: 85,
    rating: 4.6,
    color: "primary",
    status: "Shipped",
    process: "64%",
  },
  {
    id: 5,
    img: img5,
    title: "Flat sandals",
    subtitle: "Trainers In White",
    price: 12,
    rating: 4.6,
    color: "success",
    status: "Delivered",
    process: "100%",
  },
  {
    id: 6,
    img: img6,
    title: "Trainers",
    subtitle: "Trainers In Blue",
    price: 76,
    rating: 4.6,
    color: "secondary",
    status: "Canceled",
    process: "0%",
  },
  {
    id: 7,
    img: img1,
    title: "Boots",
    subtitle: "Trainers In White",
    price: 76,
    rating: 4.6,
    color: "primary",
    status: "Shipped",
    process: "64%",
  },
  {
    id: 8,
    img: img2,
    title: "Flat sandals",
    subtitle: "Trainers In White",
    price: 76,
    rating: 4.6,
    color: "success",
    status: "Delivered",
    process: "100%",
  },
  {
    id: 9,
    img: img3,
    title: "Trainers",
    subtitle: "Trainers In White",
    price: 76,
    rating: 4.6,
    color: "secondary",
    status: "Canceled",
    process: "0%",
  },
  {
    id: 10,
    img: img4,
    title: "Boots",
    subtitle: "Trainers In Blue",
    price: 76,
    rating: 4.6,
    color: "primary",
    status: "Shipped",
    process: "64%",
  },
  {
    id: 11,
    img: img5,
    title: "Trainers",
    subtitle: "Trainers In White",
    price: 71,
    rating: 4.6,
    color: "success",
    status: "Delivered",
    process: "100%",
  },
  {
    id: 12,
    img: img6,
    title: "Flat sandals",
    subtitle: "Trainers In Blue",
    price: 76,
    rating: 4.6,
    color: "secondary",
    status: "Canceled",
    process: "0%",
  },
];

const PRODUCT_IMAGE_STYLE = { width: "100%", minHeight: 400 };
const PAYMENT_METHODS = [
  { src: payment1, alt: "mastercard" },
  { src: payment2, alt: "paypal" },
  { src: payment3, alt: "visa" },
  { src: payment4, alt: "americanexpress" },
];

const SuggestionCard = ({ product, classes }) => (
  <Card className={classes.card}>
    <CardActionArea>
      <CardMedia
        className={classes.media}
        image={product.img}
        title={product.img}
      />
      <CardContent>
        <Typography gutterBottom variant="h5" component="h2">
          {product.title}
        </Typography>
        <Typography variant="body2" component="p">
          {product.subtitle}
        </Typography>
      </CardContent>
    </CardActionArea>
    <CardActions
      style={{ display: "flex", justifyContent: "space-between" }}
    >
      <Typography variant="body2" component="p">
        ${product.price}
      </Typography>
      <div
        style={{
          color: yellow[700],
          display: "flex",
          alignItems: "center",
        }}
      >
        {product.rating}
        <StarIcon style={{ color: yellow[700], marginLeft: 5 }} />
      </div>
    </CardActions>
  </Card>
);

const Product = () => {
  const { id } = useParams();
  const productId = Number(id);
  const isProductIdValid = productId > 0;

  const ratingTitleProduct = isProductIdValid
    ? rows[productId - 1]
    : rows[0];
  const priceSubtitleProduct = isProductIdValid
    ? rows[productId]
    : rows[0];

  const classes = useStyles();

  const [size, setSize] = useState("");
  const [quantity, setQuantity] = useState(1);

  const handleSizeChange = (event) => {
    setSize(event.target.value);
  };

  const handleQuantityChange = (event) => {
    setQuantity(event.target.value);
  };

  const renderLargeRating = (rating) => (
    <div style={{ fontSize: "1.5rem", color: yellow[700] }}>
      {rating}
      <StarIcon style={{ color: yellow[700], marginTop: -5 }} />
    </div>
  );

  const renderStandardRating = (rating) => (
    <>
      <Typography style={{ color: yellow[700] }} display="inline">
        {rating}
      </Typography>
      <StarIcon style={{ color: yellow[700], marginTop: -5 }} />
    </>
  );

  return (
    <>
      <Grid container spacing={3}>
        <Grid size={12}>
          <Widget disableWidgetMenu noBodyPadding>
            <Grid container>
              <Grid size={{ xs: 12, md: 6 }}>
                <img
                  src={ratingTitleProduct.img}
                  alt={ratingTitleProduct.title}
                  style={PRODUCT_IMAGE_STYLE}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Box
                  m={3}
                  display="flex"
                  flexDirection="column"
                  justifyContent="space-between"
                  style={{ height: "calc(100% - 48px)" }}
                >
                  <Box>
                    {isProductIdValid
                      ? renderStandardRating(ratingTitleProduct.rating)
                      : renderLargeRating(ratingTitleProduct.rating)}
                  </Box>
                  <Box>
                    <Typography variant="h3" uppercase>
                      {ratingTitleProduct.title}
                    </Typography>
                    <Typography>
                      {priceSubtitleProduct.subtitle}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography weight="medium" variant="h5">
                      ${priceSubtitleProduct.price}
                    </Typography>
                  </Box>
                  <Box>
                    <Link>Size Guide</Link>
                  </Box>
                  <Box display="flex" alignItems="center">
                    <FormControl
                      variant="outlined"
                      className={classes.form}
                      style={{ marginRight: 15 }}
                    >
                      <InputLabel htmlFor="size-simple">
                        Select size
                      </InputLabel>
                      <Select
                        value={size}
                        onChange={handleSizeChange}
                        label="Select size"
                        inputProps={{
                          name: "size",
                          id: "size-simple",
                        }}
                        className={classes.denseSelect}
                      >
                        <MenuItem value={1}>1</MenuItem>
                        <MenuItem value={2}>2</MenuItem>
                        <MenuItem value={3}>3</MenuItem>
                        <MenuItem value={4}>4</MenuItem>
                        <MenuItem value={5}>5</MenuItem>
                      </Select>
                    </FormControl>
                    <FormControl className={classes.form}>
                      <Select
                        value={quantity}
                        onChange={handleQuantityChange}
                        className={classes.selectEmpty}
                        margin="dense"
                      >
                        <MenuItem value={1}>1</MenuItem>
                        <MenuItem value={2}>2</MenuItem>
                        <MenuItem value={3}>3</MenuItem>
                        <MenuItem value={4}>4</MenuItem>
                        <MenuItem value={5}>5</MenuItem>
                        <MenuItem value={5}>6</MenuItem>
                        <MenuItem value={5}>7</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                  <Box display="flex" alignItems="center">
                    <Button
                      color="primary"
                      variant="contained"
                      style={{ flexGrow: 3 }}
                    >
                      add to bag
                      <ShoppingCartIcon style={{ marginLeft: 8 }} />
                    </Button>
                    <StarOutlinedIcon
                      style={{ marginLeft: 16 }}
                      className={classes.form}
                    />
                  </Box>
                  <Box display="flex" alignItems="center">
                    {PAYMENT_METHODS.map((method, index) => (
                      <img
                        key={method.alt}
                        src={method.src}
                        alt={method.alt}
                        style={{
                          width: 40,
                          marginRight: index < PAYMENT_METHODS.length - 1 ? 8 : 0,
                        }}
                      />
                    ))}
                  </Box>
                  <Typography color="text" colorBrightness="secondary">
                    FREE Delivery & Returns
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Widget>
        </Grid>
        <Grid size={12}>
          <Widget disableWidgetMenu title="Product Info">
            <Grid container>
              <Grid size={12}>
                <Grid container spacing={3}>
                  <Grid container direction="column" size={{ xs: 12, md: 4 }}>
                    <Typography variant="h5" style={{ marginBottom: 16 }}>
                      PRODUCT DESCRIPTION
                    </Typography>
                    <ul>
                      <li>
                        Sneakers (also known as athletic shoes, tennis shoes,gym
                        shoes, runners, takkies, or trainers) are shoes
                        primarily designed for sports or other forms of physical
                        exercise, but which are now also often used for everyday
                        wear.
                      </li>
                      <li>
                        The term generally describes a type of footwear with a
                        flexible sole made of rubber or synthetic material and
                        an upper part made of leather or synthetic materials.
                      </li>
                    </ul>
                  </Grid>
                  <Grid
                    container
                    direction="column"
                    justify="space-between"
                    size={{ xs: 12, md: 4 }}
                  >
                    <Box>
                      <Typography variant="h5" style={{ marginBottom: 16 }}>
                        PRODUCT CODE
                      </Typography>
                      <p>135234</p>
                    </Box>
                    <Box>
                      <Typography variant="h5" style={{ marginBottom: 16 }}>
                        TECHNOLOGY
                      </Typography>
                      <ul>
                        <li>Ollie patch</li>
                        <li>Cup soles</li>
                        <li>Vulcanized rubber soles</li>
                      </ul>
                    </Box>
                  </Grid>
                  <Grid container direction="column" size={{ xs: 12, md: 4 }}>
                    <Box>
                      <Typography variant="h5" style={{ marginBottom: 16 }}>
                        SHARE
                      </Typography>
                      <p>
                        Share photo with a tag{" "}
                        <Link to="#" color="primary">
                          #whitetrainers
                        </Link>
                      </p>
                      <Box mb={1} ml="-16px">
                        <IconButton aria-label="facebook">
                          <FacebookIcon style={{ color: "#6E6E6E99" }} />
                        </IconButton>
                        <IconButton aria-label="instagram">
                          <InstagramIcon style={{ color: "#6E6E6E99" }} />
                        </IconButton>
                        <IconButton aria-label="twitter">
                          <TwitterIcon style={{ color: "#6E6E6E99" }} />
                        </IconButton>
                      </Box>
                    </Box>
                    <Box>
                      <Typography variant="h5" style={{ marginBottom: 16 }}>
                        RATING & REVIEWS
                      </Typography>
                      {isProductIdValid
                        ? renderStandardRating(ratingTitleProduct.rating)
                        : renderLargeRating(ratingTitleProduct.rating)}
                      <p>32 Reviews</p>
                      <Link to="#" color="primary">
                        Read all
                      </Link>
                    </Box>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Widget>
        </Grid>
      </Grid>
      <PageTitle title="You may also like" />
      <Grid size={12}>
        <Box display="flex" flexWrap="wrap">
          {rows.slice(0, 4).map((product, index) => (
            <Box
              key={product.id}
              flexGrow={1}
              mr={index < 3 ? 3 : 0}
              mb={3}
            >
              <SuggestionCard product={product} classes={classes} />
            </Box>
          ))}
        </Box>
      </Grid>
    </>
  );
};

export default Product;