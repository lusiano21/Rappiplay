import OrderModel from '../models/order.js'

  export const createOrder = (order) => {
    const result = OrderModel.create(order)
    return result
  }
  
  export const getOrders = (query) => {
    return OrderModel.find(query)
  }
  
  export const getOrderById = (id) => {
    return OrderModel.findById(id)
  }
  
  export const updateOrderById = (id, data) => {
    return OrderModel.updateOne({ _id: id }, data)
  }
  
  export const deleteOrderById = (id) => {
    return OrderModel.deleteOne({ _id: id })
  }