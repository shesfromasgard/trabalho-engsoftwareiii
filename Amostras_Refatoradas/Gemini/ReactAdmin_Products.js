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
import useStyles from "./styles";
import { yellow } from "@mui/material/colors";
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

export const rows = [
  { id: 1, img: img1, title: "Trainers", subtitle: "Trainers In White", price: 76, rating: 4.6, color: "primary", status: "Shipped", process: "64%" },
  { id: 2, img: img2, title: "Boots", subtitle: "Trainers In Blue", price: 37, rating: 4.6, color: "success", status: "Delivered", process: "100%" },
  { id: 3, img: img3, title: "Flat sandals", subtitle: "Trainers In White", price: 70, rating: 4.6, color: "secondary", status: "Canceled", process: "0%" },
  { id: 4, img: img4, title: "Trainers", subtitle: "Trainers In Blue", price: 85, rating: 4.6, color: "primary", status: "Shipped", process: "64%" },
  { id: 5, img: img5, title: "Flat sandals", subtitle: "Trainers In White", price: 12, rating: 4.6, color: "success", status: "Delivered", process: "100%" },
  { id: 6, img: img6, title: "Trainers", subtitle: "Trainers In Blue", price: 76, rating: 4.6, color: "secondary", status: "Canceled", process: "0%" },
  { id: 7, img: img1, title: "Boots", subtitle: "Trainers In White", price: 76, rating: 4.6, color: "primary", status: "Shipped", process: "64%" },
  { id: 8, img: img2, title: "Flat sandals", subtitle: "Trainers In White", price: 76, rating: 4.6, color: "success", status: "Delivered", process: "100%" },
  { id: 9, img: img3, title: "Trainers", subtitle: "Trainers In White", price: 76, rating: 4.6, color: "secondary", status: "Canceled", process: "0%" },
  { id: 10, img: img4, title: "Boots", subtitle: "Trainers In Blue", price: 76, rating: 4.6, color: "primary", status: "Shipped", process: "64%" },
  { id: 11, img: img5, title: "Trainers", subtitle: "Trainers In White", price: 71, rating: 4.6, color: "success", status: "Delivered", process: "100%" },
  { id: 12, img: img6, title: "Flat sandals", subtitle: "Trainers In Blue", price: 76, rating: 4.6, color: "secondary", status: "Canceled", process: "0%" },
];

const PAYMENT_METHODS = [
  { src: payment1, alt: "mastercard" },
  { src: payment2, alt: "paypal" },
  { src: payment3, alt: "visa" },
  { src: payment4, alt: "americanexpress" },
];

// Isolated Sub-components for Clean Code and Single Responsibility Principle
const RatingDisplay = ({ isProductDefined, targetProduct }) => {
  if (!isProductDefined) {
    return (
      <div style={{ fontSize: "1.5rem", color: yellow[700] }}>
        {rows[0].rating}
        <StarIcon style={{ color: yellow[700], marginTop: -5 }} />
      </div>
    );
  }

  return (
    <>
      <Typography style={{ color: yellow[700] }} display="inline">
        {targetProduct.rating}
      </Typography>
      <StarIcon style={{ color: yellow[700], marginTop: -5 }} />
    </>
  );
};

const ProductHeader = ({ isProductDefined, mainProduct, fallbackProduct }) => (
  <Box>
    <Typography variant="h3" uppercase>
      {mainProduct.title}
    </Typography>
    <Typography>{fallbackProduct.subtitle}</Typography>
  </Box>
);

const PriceDisplay = ({ isProductDefined, fallbackProduct }) => {
  if (!isProductDefined) {
    return (
      <Typography weight="medium" variant="h5">
        ${rows[0].price}
      </Typography>
    );
  }

  return <Typography weight="medium">${fallbackProduct.price}</Typography>;
};

const SizeSelectors = ({ size, onSizeChange, addSize, onAddSizeChange, classes }) => (
  <Box display="flex" alignItems="center">
    <FormControl variant="outlined" className={classes.form} style={{ marginRight: 15 }}>
      <InputLabel htmlFor="size-simple">Select size</InputLabel>
      <Select
        value={size}
        onChange={onSizeChange}
        label="Select size"
        inputProps={{ name: "size", id: "size-simple" }}
        className={classes.denseSelect}
      >
        {[1, 2, 3, 4, 5].map((val) => (
          <MenuItem key={val} value={val}>{val}</MenuItem>
        ))}
      </Select>
    </FormControl>

    <FormControl className={classes.form}>
      <Select
        value={addSize}
        onChange={onAddSizeChange}
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
);

const ActionButtons = ({ classes }) => (
  <Box display="flex" alignItems="center">
    <Button color="primary" variant="contained" style={{ flexGrow: 3 }}>
      add to bag
      <ShoppingCartIcon style={{ marginLeft: 8 }} />
    </Button>
    <StarOutlinedIcon style={{ marginLeft: 16 }} className={classes.form} />
  </Box>
);

const PaymentIcons = () => (
  <Box display="flex" alignItems="center">
    {PAYMENT_METHODS.map((payment, idx) => (
      <img
        key={payment.alt}
        src={payment.src}
        alt={payment.alt}
        style={{
          width: 40,
          marginRight: idx < PAYMENT_METHODS.length - 1 ? 8 : 0,
        }}
      />
    ))}
  </Box>
);

const ProductDetailsTab = ({ isProductDefined, mainProduct, classes }) => (
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
                Sneakers (also known as athletic shoes, tennis shoes, gym shoes, runners, takkies, or trainers) are
                shoes primarily designed for sports or other forms of physical exercise, but which are now also often
                used for everyday wear.
              </li>
              <li>
                The term generally describes a type of footwear with a flexible sole made of rubber or synthetic
                material and an upper part made of leather or synthetic materials.
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
              <RatingDisplay isProductDefined={isProductDefined} targetProduct={mainProduct} />
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
);

const SuggestionsSection = ({ classes }) => {
  const suggestionsConfig = [
    { img: img1, title: rows[0].title, subtitle: rows[0].subtitle, price: rows[0].price, rating: rows[0].rating, mediaTitle: rows[0].title, hasMarginRight: true },
    { img: img2, title: rows[1].title, subtitle: rows[1].subtitle, price: rows[1].price, rating: rows[1].rating, mediaTitle: rows[1].img, hasMarginRight: true },
    { img: img3, title: rows[2].title, subtitle: rows[2].subtitle, price: rows[2].price, rating: rows[2].rating, mediaTitle: rows[2].img, hasMarginRight: true },
    { img: img4, title: rows[3].title, subtitle: rows[3].subtitle, price: rows[3].price, rating: rows[3].rating, mediaTitle: rows[3].img, hasMarginRight: false },
  ];

  return (
    <>
      <PageTitle title="You may also like" />
      <Grid size={12}>
        <Box display="flex" flexWrap="wrap">
          {suggestionsConfig.map((item, index) => (
            <Box key={index} flexGrow={1} mr={item.hasMarginRight ? 3 : 0} mb={3}>
              <Card className={classes.card}>
                <CardActionArea>
                  <CardMedia className={classes.media} image={item.img} title={item.mediaTitle} />
                  <CardContent>
                    <Typography gutterBottom variant="h5" component="h2">
                      {item.title}
                    </Typography>
                    <Typography variant="body2" component="p">
                      {item.subtitle}
                    </Typography>
                  </CardContent>
                </CardActionArea>
                <CardActions style={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" component="p">
                    ${item.price}
                  </Typography>
                  <div style={{ color: yellow[700], display: "flex", alignItems: "center" }}>
                    {item.rating}
                    <StarIcon style={{ color: yellow[700], marginLeft: 5 }} />
                  </div>
                </CardActions>
              </Card>
            </Box>
          ))}
        </Box>
      </Grid>
    </>
  );
};

// Main Product Component
const Product = () => {
  const { id } = useParams();
  const productId = Number(id);
  const classes = useStyles();

  const [size, setValues] = React.useState("");
  const [addSize, setAddSize] = React.useState(1);

  const handleSizeChange = (event) => setValues(event.target.value);
  const handleAddSizeChange = (event) => setAddSize(event.target.value);

  const isProductDefined = !!productId;
  
  // Strict operational mappings to precisely preserve the exact index selection logic and quirks
  const mainProduct = isProductDefined ? rows[productId - 1] : rows[0];
  const fallbackProduct = isProductDefined ? rows[productId] : rows[0];

  return (
    <>
      <Grid container spacing={3}>
        <Grid size={12}>
          <Widget disableWidgetMenu noBodyPadding>
            <Grid container>
              <Grid size={{ xs: 12, md: 6 }}>
                <img
                  src={mainProduct.img}
                  alt={mainProduct.title}
                  style={{ width: "100%", minHeight: 400 }}
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
                    <RatingDisplay isProductDefined={isProductDefined} targetProduct={mainProduct} />
                  </Box>

                  <ProductHeader
                    isProductDefined={isProductDefined}
                    mainProduct={mainProduct}
                    fallbackProduct={fallbackProduct}
                  />

                  <Box>
                    <PriceDisplay isProductDefined={isProductDefined} fallbackProduct={fallbackProduct} />
                  </Box>

                  <Box>
                    <Link>Size Guide</Link>
                  </Box>

                  <SizeSelectors
                    size={size}
                    onSizeChange={handleSizeChange}
                    addSize={addSize}
                    onAddSizeChange={handleAddSizeChange}
                    classes={classes}
                  />

                  <ActionButtons classes={classes} />

                  <PaymentIcons />

                  <Typography color="text" colorBrightness="secondary">
                    FREE Delivery & Returns
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Widget>
        </Grid>

        <Grid size={12}>
          <ProductDetailsTab
            isProductDefined={isProductDefined}
            mainProduct={mainProduct}
            classes={classes}
          />
        </Grid>
      </Grid>

      <SuggestionsSection classes={classes} />
    </>
  );
};

export default Product;