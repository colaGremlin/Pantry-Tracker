'use client'

import { useState, useEffect } from 'react'
import { Box, Stack, Typography, Button, Modal, TextField, MenuItem, FormControl, Select, InputLabel, Grid } from '@mui/material'
import { firestore } from './firebase'
import {
  doc,
  getDocs,
  query,
  setDoc,
  deleteDoc,
  getDoc,
  collection
} from 'firebase/firestore'

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'white',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
}

const greyColor = '#666666'

const orangeBorder = {
  '& .MuiOutlinedInput-root': {
    '& fieldset': {
      borderColor: '#F27D30',
    },
    '&:hover fieldset': {
      borderColor: '#F27D30',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#F27D30',
    },
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: '#F27D30',
  },
  '& .MuiInputLabel-root:hover': {
    color: '#F27D30',
  },
  '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: '#F27D30',
  },
}

export default function Home() {
  const [inventory, setInventory] = useState([])
  const [open, setOpen] = useState(false)
  const [itemName, setItemName] = useState('')
  const [itemQuantity, setItemQuantity] = useState('')
  const [itemExpirationDate, setItemExpirationDate] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOption, setSortOption] = useState('name')
  const [sortOrder, setSortOrder] = useState('asc') // default to ascending

  const updateInventory = async () => {
    const snapshot = query(collection(firestore, 'inventory'))
    const docs = await getDocs(snapshot)
    const inventoryList = []
    docs.forEach((doc) => {
      inventoryList.push({ name: doc.id, ...doc.data() })
    })
    setInventory(inventoryList)
  }

  useEffect(() => {
    updateInventory()
  }, [])

  const addItemOptimistic = async (item) => {
    const newItem = {
      name: item,
      quantity: Number(itemQuantity),
      expirationDate: itemExpirationDate
    }

    setInventory(prevInventory => {
      const existingItem = prevInventory.find(i => i.name === item)
      if (existingItem) {
        return prevInventory.map(i => i.name === item
          ? { ...i, quantity: i.quantity + newItem.quantity }
          : i)
      } else {
        return [newItem, ...prevInventory]
      }
    })

    const docRef = doc(collection(firestore, 'inventory'), item)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      const { quantity } = docSnap.data()
      await setDoc(docRef, { ...newItem, quantity: quantity + newItem.quantity })
    } else {
      await setDoc(docRef, newItem)
    }

    await updateInventory()
  }

  const increaseItemQuantityOptimistic = async (item) => {
    setInventory(prevInventory => (
      prevInventory.map(i => i.name === item ? { ...i, quantity: i.quantity + 1 } : i)
    ))

    const docRef = doc(collection(firestore, 'inventory'), item)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      const { quantity } = docSnap.data()
      await setDoc(docRef, { quantity: quantity + 1 })
    }

    await updateInventory()
  }

  const removeItemOptimistic = async (item) => {
    setInventory(prevInventory => 
      prevInventory
        .map(i => i.name === item ? { ...i, quantity: i.quantity - 1 } : i)
        .filter(i => i.quantity > 0)
    )

    const docRef = doc(collection(firestore, 'inventory'), item)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      const { quantity } = docSnap.data()
      if (quantity === 1) {
        await deleteDoc(docRef)
      } else {
        await setDoc(docRef, { quantity: quantity - 1 })
      }
    }

    await updateInventory()
  }

  const handleOpen = () => setOpen(true)
  const handleClose = () => setOpen(false)

  // Filter and Sort inventory based on search query, sort option, and order
  const filteredInventory = inventory
    .filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      let comparison = 0

      if (sortOption === 'name') {
        comparison = a.name.localeCompare(b.name)
      } else if (sortOption === 'quantity') {
        comparison = a.quantity - b.quantity
      } else if (sortOption === 'expirationDate') {
        comparison = new Date(a.expirationDate) - new Date(b.expirationDate)
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })

  return (
    <Box
      width="100vw"
      height="100vh"
      display={'flex'}
      flexDirection={'column'}
      alignItems={'center'}
      gap={2}
      bgcolor="rgba(242, 217, 86, 0.2)"
      color={greyColor}
    >
      <Box
        width="100%"
        display="flex"
        justifyContent="flex-start"
        alignItems="center"
        padding="16px"
        style={{ paddingBottom: '80px' }} // Further increased padding below heading for better centering
      >
        <Typography variant="h3" fontWeight="bold" fontFamily="PT Sans" color={greyColor} style={{ fontFamily: 'PT Sans' }}>
          Pantry Tracker
        </Typography>
      </Box>

      <Box
        display="flex"
        flexDirection="column"
        gap={2}
        width="800px"
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" width="100%" gap={2}>
          <TextField
            id="search-bar"
            label="Search Items"
            variant="outlined"
            style={{ width: '300px', backgroundColor: 'rgba(242, 242, 232, 0.8)', fontFamily: 'PT Sans' }} // Adjust width and color
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputLabelProps={{ style: { color: greyColor, fontFamily: 'PT Sans' } }} // Label color
            inputProps={{ style: { color: greyColor, fontFamily: 'PT Sans' } }} // Input text color
            sx={orangeBorder}
          />

          <FormControl variant="outlined" style={{ width: '150px', backgroundColor: 'rgba(242, 242, 232, 0.8)', fontFamily: 'PT Sans' }}>
            <InputLabel id="sort-by-label" style={{ color: greyColor, fontFamily: 'PT Sans' }}>Sort By</InputLabel>
            <Select
              labelId="sort-by-label"
              id="sort-by"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              label="Sort By"
              inputProps={{ style: { color: greyColor, fontFamily: 'PT Sans' } }}
              style={{ fontFamily: 'PT Sans' }}
              sx={orangeBorder}
            >
              <MenuItem value="name" style={{ fontFamily: 'PT Sans' }}>Name</MenuItem>
              <MenuItem value="quantity" style={{ fontFamily: 'PT Sans' }}>Quantity</MenuItem>
              <MenuItem value="expirationDate" style={{ fontFamily: 'PT Sans' }}>Expiration Date</MenuItem>
            </Select>
          </FormControl>

          <FormControl variant="outlined" style={{ width: '150px', backgroundColor: 'rgba(242, 242, 232, 0.8)', fontFamily: 'PT Sans' }}>
            <InputLabel id="sort-order-label" style={{ color: greyColor, fontFamily: 'PT Sans' }}>Order</InputLabel>
            <Select
              labelId="sort-order-label"
              id="sort-order"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              label="Order"
              inputProps={{ style: { color: greyColor, fontFamily: 'PT Sans' } }}
              style={{ fontFamily: 'PT Sans' }}
              sx={orangeBorder}
            >
              <MenuItem value="asc" style={{ fontFamily: 'PT Sans' }}>Ascending</MenuItem>
              <MenuItem value="desc" style={{ fontFamily: 'PT Sans' }}>Descending</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="contained"
            onClick={handleOpen}
            style={{
              backgroundColor: '#F27D30',
              color: greyColor,
              fontFamily: 'PT Sans',
              height: '56px', // Match the height of the TextField and FormControl
            }}
          >
            Add Item
          </Button>
        </Box>
      </Box>

      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
        sx={{ color: greyColor }}
      >
        <Box sx={style}>
          <Typography id="modal-modal-title" variant="h6" component="h2" color={greyColor} style={{ fontFamily: 'PT Sans' }}>
            Add Item
          </Typography>
          <Stack width="100%" direction={'column'} spacing={2} gap={3}> {/* Increased gap between input fields and buttons */}
            <TextField
              id="outlined-basic"
              label="Item"
              variant="outlined"
              fullWidth
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              InputLabelProps={{ style: { color: greyColor, fontFamily: 'PT Sans' } }} // Label color
              inputProps={{ style: { color: greyColor, fontFamily: 'PT Sans' } }} // Input text color
              style={{ fontFamily: 'PT Sans' }}
              sx={orangeBorder}
            />
            <TextField
              id="outlined-quantity"
              label="Quantity"
              variant="outlined"
              fullWidth
              type="number"
              value={itemQuantity}
              onChange={(e) => setItemQuantity(e.target.value)}
              InputLabelProps={{ style: { color: greyColor, fontFamily: 'PT Sans' } }} // Label color
              inputProps={{ style: { color: greyColor, fontFamily: 'PT Sans' } }} // Input text color
              style={{ fontFamily: 'PT Sans' }}
              sx={orangeBorder}
            />
            <TextField
              id="outlined-expiration-date"
              label="Expiration Date"
              variant="outlined"
              fullWidth
              type="date"
              InputLabelProps={{ shrink: true, style: { color: greyColor, fontFamily: 'PT Sans' } }}
              value={itemExpirationDate}
              onChange={(e) => setItemExpirationDate(e.target.value)}
              inputProps={{ style: { color: greyColor, fontFamily: 'PT Sans' } }} // Input text color
              style={{ fontFamily: 'PT Sans' }}
              sx={orangeBorder}
            />
            <Stack direction="row" spacing={2} justifyContent="space-between">
              <Button
                variant="outlined"
                onClick={() => {
                  addItemOptimistic(itemName)
                  setItemName('')
                  setItemQuantity('')
                  setItemExpirationDate('')
                  handleClose()
                }}
                style={{ backgroundColor: '#F27D30', color: greyColor, flexGrow: 1, fontFamily: 'PT Sans' }}
              >
                Add Item
              </Button>
              <Button
                variant="outlined"
                onClick={handleClose}
                style={{ backgroundColor: '#F27D30', color: greyColor, flexGrow: 1, fontFamily: 'PT Sans' }}
              >
                Cancel
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Modal>

      <Box border={'1px solid #F27D30'} mt={2} style={{ backgroundColor: '#F2F2E8' }}>
        <Box
          width="900px"
          height="100px"
          bgcolor={'#F27D30'}
          display={'flex'}
          justifyContent={'center'}
          alignItems={'center'}
          color={greyColor}
        >
          <Typography variant={'h3'} color={greyColor} textAlign={'center'} style={{ fontFamily: 'PT Sans' }}>
            Pantry Items
          </Typography>
        </Box>
        <Stack width="900px" height="450px" spacing={1} overflow={'auto'}>
          {filteredInventory.map(({ name, quantity, expirationDate }) => (
            <Box
              key={name}
              width="100%"
              minHeight="150px"
              display={'flex'}
              justifyContent={'space-between'}
              alignItems={'center'}
              bgcolor={'rgba(242, 242, 232, 0.8)'}
              paddingX={5}
              sx={{
                ...orangeBorder,
                borderBottom: '1px solid #F27D30', // Add a border between rows
              }}
            >
              <Grid container spacing={2} alignItems="center"> {/* Adjusted spacing to 2 */}
                <Grid item xs={3}>
                  <Typography variant={'h5'} color={greyColor} textAlign={'left'} style={{ fontFamily: 'PT Sans' }}>
                    {name.charAt(0).toUpperCase() + name.slice(1)}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant={'h5'} color={greyColor} textAlign={'left'} style={{ fontFamily: 'PT Sans' }}>
                    Quantity: {quantity}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant={'h5'} color={greyColor} textAlign={'left'} style={{ fontFamily: 'PT Sans' }}>
                    Expires: {expirationDate || 'N/A'}
                  </Typography>
                </Grid>
              </Grid>
              <Box display="flex" gap={2}>
                <Button variant="contained" onClick={() => increaseItemQuantityOptimistic(name)} style={{ backgroundColor: '#F27D30', color: greyColor, fontFamily: 'PT Sans' }}>
                  +
                </Button>
                <Button variant="contained" onClick={() => removeItemOptimistic(name)} style={{ backgroundColor: '#F27D30', color: greyColor, fontFamily: 'PT Sans' }}>
                  -
                </Button>
              </Box>
            </Box>
          ))}
        </Stack>
      </Box>
    </Box>
  )
} 





























