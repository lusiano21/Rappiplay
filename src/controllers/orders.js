import {
  getOrders,
  createOrder,
  getOrderById,
  updateOrderById,
  deleteOrderById
} from '../dao/order.js'
import {
  getUserById,
  updateUserById
} from '../dao/user.js'
import {
  getProductsById,
  updateProductsById
} from '../dao/products.js'
import twilioService from '../servicios/twilio.service.js'
import emailService from '../servicios/email.service.js'
import { NotFoundException } from '../utils/exception.js'

export const get = async (query = {}) => {
  const orders = await getOrders(query)
  return {
    status: 'success',
    payload: orders,
  }
}

export const create = async (body) => {
  let {
    user: userId,
    products: productsRequest,
  } = body
  const user = await getUserById(userId)
  if (!user) {
    throw new NotFoundException('User not found')
  }
  let buy;
  const trolley = productsRequest.reduce((result, item)=> {
    const products = getProductsById(item.product)
    buy = products
    console.log("Prodocts:", products)
  if (!products) {
    throw new NotFoundException('Products not found')
  }else{
      if(products.price == item.price && products.stock >= item.quantity){
        result.push({
        product: item.product,
        id: item.id, 
        price: products.price,
        quantity: item.quantity,
      });
      }
      return result
    }
  }, [])
  console.log("Prodocts 2:", buy)
  console.log("Carrito:",trolley)
  const total = trolley.reduce((acc, product) => {
    return acc + product.price * product.quantity
  }, 0)
  if(trolley.length !== 0){
    const newOrder = {
    user: user.id,
    products: trolley,
    total,
  }
  let repeat = user.orders.find(product => product.user == user.id);
  console.log('Repeat', repeat)
  const order = await createOrder(newOrder)
  user.orders.push(`${order.id}`)
  await updateUserById(`${user.id}`, user)
  return {
    status: 'success',
    payload: order,
  }
  }else{
    const newOrder = {
      user: user.id,
      products: trolley,
      total,
      status:'canceled'
    }
    const order = await createOrder(newOrder)
    return {
      status: 'success',
      payload: order,
    }
  }
}

export const getById = async (id) => {
  const order = await getOrderById(id)
  if (!order) {
    throw new NotFoundException('Order not found')
  }
  return {
    status: 'success',
    payload: order,
  }
}

export const updateById = async (id, body) => {
  const order = await getOrderById(id)
  if (!order) {
    throw new NotFoundException('Order not found')
  }
  const result = await updateOrderById(id, body)
  return {
    status: 'success',
    payload: result,
  }
}

export const removeById = async (id) => {
  const order = await getOrderById(id)
  if (!order) {
    throw new NotFoundException('Order not found')
  }
  const result = await deleteOrderById(id)
  if(order.status == "pending"){
  const user = await getUserById(order.user)
    if (!user) {
      throw new NotFoundException('User not found')
    }
  user.orders = user.orders.filter((or) =>{ 
    return or._id != order.id
  })
  await updateUserById(`${user.id}`, user)
  }
  return {
    status: 'success',
    payload: result,
  }
}

export const addProduct = async (id, body) => {
  const order = await getOrderById(id)
  if (!order) {
    throw new NotFoundException('Order not found')
  }
  const { products } = body
  order.products = products
  await updateOrderById(id, order)
  return {
    status: 'success',
    payload: order,
  }
}

export const resolve = async (id, body) => {
  const order = await getOrderById(id)
  if (!order) {
    throw new NotFoundException('Order not found')
  }
  const { status } = body
  order.status = status
  await updateOrderById(id, order)
  if(order.status == "completed"){
    const user = await getUserById(order.user)
    if (!user) {
      throw new NotFoundException('User not found')
    }
    const business = await getProductsById(order.product)
    if (!business) {
      throw new NotFoundException('Products not found')
    }
    const product = order.products.map((product) => product.quantity)
    const [a] = product
    if(business.stock >= a){
      const subtotal = order.products.reduce((acc, product) => {
        return acc + (business.stock - product.quantity)
      }, 0)
      await updateProductsById(`${order.product}`, {"stock":`${subtotal}`});
      user.orders = user.orders.filter((or) =>{ 
        return or._id != order.id
      })
      await updateUserById(`${user.id}`, user)
      await emailService.sendEmail(
        `${user.email}`,
        'Compra en Rappiplay',
        `
        <div>
          <h1>Hola ${user.fullname}.</h1>
          <p>Somos de Rappiplay y queremos contarte que tu order se enviado con exito.</p>
          <table>
            <tr>
              <th>Factura</th>
            </tr>
            <tr>
              <td>Id: ${order.id}</td>
            </tr>
              <td>Usuario: ${user.email}</td>
            </tr>
            </tr>
              <td>Local: ${business.name}</td>
            </tr>
            </tr>
              <td>Local: ${business.menu}</td>
            </tr>
            </tr>
              <td>Local: ${business.price}</td>
            </tr>
            <tr>   
               <td>Total: ${order.total}</td>
            </tr>
            <tr>
               <td>Fecha: ${order.createdAt}</td>
            </tr>
          </table>
          <p>Muchas gracias por tu orden.</p>
        </div>
        `
      )
      await twilioService.sendSMS(`+54${user.phone.toString()}`, `Hola somos de Rappiplay muchas gracias por tu compra, te enviamos los detalles de tu compra por correo`)
    } else{
      order.status = 'pending'
      await updateOrderById(id, order)
    }
  }
  return {
    status: 'success',
    payload: order,
  }
}