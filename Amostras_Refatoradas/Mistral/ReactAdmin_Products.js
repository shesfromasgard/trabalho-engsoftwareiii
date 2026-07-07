import React from "react";
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
import { useParams } from "react-router-dom";

// Components
import Widget from "../../components/Widget";
import PageTitle from "../../components/PageTitle";
import { Typography, Link, Button } from "../../components/Wrappers";

// Images
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

// Constants
const PRODUCTS = [
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

const PAYMENT_METHODS = [
  { src: payment1, alt: "mastercard" },
  { src: payment2, alt: "paypal" },
  { src: payment3, alt: "visa" },
  { src: payment4, alt: "americanexpress" },
];

const SIZE_OPTIONS = [1, 2, 3, 4, 5, 6, 7];

const ProductImage = ({ product }) => (
  <img src={product.img} alt={product.title} style={{ width: "100%", minHeight: 400 }} />
);

const RatingDisplay = ({ rating }) => (
  <Box display="flex" alignItems="center" style={{ color: yellow[700] }}>
    <Typography display="inline">{rating}</Typography>
    <StarIcon style={{ marginTop: -5 }} />
  </Box>
);

const ProductTitle = ({ title, subtitle }) => (
  <>
    <Typography variant="h3" uppercase>
      {title}
    </Typography>
    <Typography>{subtitle}</Typography>
  </>
);

const ProductPrice = ({ price }) => (
  <Typography weight="medium" variant="h5">
    ${price}
  </Typography>
);

const SizeSelector = ({ value, onChange, label, className }) => (
  <FormControl variant="outlined" className={className} style={{ marginRight: 15 }}>
    <InputLabel htmlFor="size-simple">{label}</InputLabel>
    <Select
      value={value}
      onChange={onChange}
      label={label}
      inputProps={{ name: "size", id: "size-simple" }}
      className={className}
    >
      {SIZE_OPTIONS.map((size) => (
        <MenuItem key={size} value={size}>
          {size}
        </MenuItem>
      ))}
    </Select>
  </FormControl>
);

const PaymentMethods = () => (
  <Box display="flex" alignItems="center">
    {PAYMENT_METHODS.map((method, index) => (
      <img
        key={index}
        src={method.src}
        alt={method.alt}
        style={{ width: 40, marginRight: index < PAYMENT_METHODS.length - 1 ? 8 : 0 }}
      />
    ))}
  </Box>
);

const SocialShare = () => (
  <Box mb={1} ml={"-16px"}>
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
);

const ProductCard = ({ product, classes }) => (
  <Card className={classes.card}>
    <CardActionArea>
      <CardMedia className={classes.media} image={product.img} title={product.title} />
      <CardContent>
        <Typography gutterBottom variant="h5" component="h2">
          {product.title}
        </Typography>
        <Typography variant="body2" component="p">
          {product.subtitle}
        </Typography>
      </CardContent>
    </CardActionArea>
    <CardActions style={{ display: "flex", justifyContent: "space-between" }}>
      <Typography variant="body2" component="p">
        ${product.price}
      </Typography>
      <RatingDisplay rating={product.rating} />
    </CardActions>
  </Card>
);

const Product = () => {
  const { id } = useParams();
  const productId = Number(id);
  const classes = useStyles();
  const [size, setSize] = React.useState("");
  const [addSize, setAddSize] = React.useState(1);

  const handleSizeChange = (event) => setSize(event.target.value);
  const handleAddSizeChange = (event) => setAddSize(event.target.value);

  const getProductById = (id) => PRODUCTS.find((product) => product.id === id) || PRODUCTS[0];
  const currentProduct = getProductById(productId);

  return (
    <>
      <Grid container spacing={3}>
        <Grid size={12}>
          <Widget disableWidgetMenu noBodyPadding>
            <Grid container>
              <Grid size={{ xs: 12, md: 6 }}>
                <ProductImage product={currentProduct} />
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
                    <RatingDisplay rating={currentProduct.rating} />
                  </Box>
                  <Box>
                    <ProductTitle title={currentProduct.title} subtitle={currentProduct.subtitle} />
                  </Box>
                  <Box>
                    <ProductPrice price={currentProduct.price} />
                  </Box>
                  <Box>
                    <Link>Size Guide</Link>
                  </Box>
                  <Box display="flex" alignItems="center">
                    <SizeSelector
                      value={size}
                      onChange={handleSizeChange}
                      label="Select size"
                      className={classes.denseSelect}
                    />
                    <FormControl className={classes.form}>
                      <Select
                        value={addSize}
                        onChange={handleAddSizeChange}
                        className={classes.selectEmpty}
                        margin="dense"
                      >
                        {SIZE_OPTIONS.map((size) => (
                          <MenuItem key={size} value={size}>
                            {size}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                  <Box display="flex" alignItems="center">
                    <Button color="primary" variant="contained" style={{ flexGrow: 3 }}>
                      add to bag
                      <ShoppingCartIcon style={{ marginLeft: 8 }} />
                    </Button>
                    <StarOutlinedIcon style={{ marginLeft: 16 }} className={classes.form} />
                  </Box>
                  <PaymentMethods />
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
                        Sneakers (also known as athletic shoes, tennis shoes, gym shoes, runners,
                        takkies, or trainers) are shoes primarily designed for sports or other forms of
                        physical exercise, but which are now also often used for everyday wear.
                      </li>
                      <li>
                        The term generally describes a type of footwear with a flexible sole made of
                        rubber or synthetic material and an upper part made of leather or synthetic
                        materials.
                      </li>
                    </ul>
                  </Grid>
                  <Grid container direction="column" justify="space-between" size={{ xs: 12, md: 4 }}>
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
                        Share photo with a tag <Link to="#" color="primary">#whitetrainers</Link>
                      </p>
                      <SocialShare />
                    </Box>
                    <Box>
                      <Typography variant="h5" style={{ marginBottom: 16 }}>
                        RATING & REVIEWS
                      </Typography>
                      <RatingDisplay rating={currentProduct.rating} />
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
          {PRODUCTS.slice(0, 4).map((product, index) => (
            <Box
              key={index}
              flexGrow={1}
              mr={index < 3 ? 3 : 0}
              mb={3}
            >
              <ProductCard product={product} classes={classes} />
            </Box>
          ))}
        </Box>
      </Grid>
    </>
  );
};

export default Product;

// Export rows for backward compatibility
export const rows = PRODUCTS;