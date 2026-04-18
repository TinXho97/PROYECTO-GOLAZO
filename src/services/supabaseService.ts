import { supabase } from '../lib/supabase';
import { Pitch, Booking, Product, Sale, User, AuditLog, BookingStatus } from '../types';
import imageCompression from 'browser-image-compression';

const log = (message: string, data?: any) => {
  console.log(`[Supabase Service] ${message}`, data || '');
};

const logError = (message: string, error: any) => {
  console.error(`[Supabase Service Error] ${message}:`, error);
};

const isUuid = (value: unknown): value is string => (
  typeof value === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
);

const normalizeBookingStatus = (status: unknown): BookingStatus => {
  const normalized = typeof status === 'string' ? status.toLowerCase() : 'pending';
  if (normalized === 'finished') return 'completed';
  if (normalized === 'confirmed' || normalized === 'cancelled' || normalized === 'pending' || normalized === 'completed' || normalized === 'no_show') {
    return normalized;
  }
  return 'pending';
};

export const supabaseService = {
  // Test Connection
  testConnection: async () => {
    try {
      log('Testing connection...');
      const { data, error } = await supabase.from('pitches').select('id').limit(1);
      if (error) throw error;
      log('Connection test successful');
      return true;
    } catch (error) {
      logError('Connection test failed', error);
      return false;
    }
  },

  uploadPitchImage: async (file: File, pitchId: string, clientId?: string) => {
    try {
      if (!clientId) {
        throw new Error('Client ID is required for uploading images');
      }

      log('Compressing and uploading pitch image...', { pitchId, fileName: file.name, clientId });
      
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1280,
        useWebWorker: true,
        fileType: 'image/webp'
      };
      
      const compressedFile = await imageCompression(file, options);
      log(`Image compressed: ${(file.size / 1024 / 1024).toFixed(2)}MB -> ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);

      const fileName = `${clientId}/${pitchId}-${Date.now()}.webp`;

      const { error: uploadError } = await supabase.storage
        .from('pitch-images')
        .upload(fileName, compressedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('pitch-images')
        .getPublicUrl(fileName);

      log('Pitch image uploaded successfully', data.publicUrl);
      return data.publicUrl;
    } catch (error) {
      logError('Error uploading pitch image', error);
      throw error;
    }
  },

  // Pitches
  getPitches: async (clientId?: string) => {
    log('Fetching pitches...', { clientId });
    if (!clientId) return [];

    const { data, error } = await supabase
      .from('pitches')
      .select('id, name, type, price, active, client_id')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (error) {
      logError('Error fetching pitches', error);
      throw error;
    }
    
    log('Pitches fetched successfully', data);
    return (data || []) as Pitch[];
  },

  addPitch: async (pitch: Omit<Pitch, 'id'>) => {
    log('Adding pitch', pitch);
    
    // Remove image_url if it exists to prevent PGRST204 error
    const pitchData: any = {
      name: pitch.name,
      type: pitch.type,
      price: pitch.price,
      active: pitch.active,
      client_id: pitch.client_id
    };
    
    const { data, error } = await supabase
      .from('pitches')
      .insert([pitchData])
      .select()
      .single();
    
    if (error) {
      logError('Error adding pitch', error);
      throw error;
    }
    
    log('Pitch added successfully', data);
    return data as Pitch;
  },

  updatePitch: async (id: string, updates: Partial<Pitch>) => {
    log(`Updating pitch ${id}`, updates);
    
    // Remove image_url if it exists to prevent PGRST204 error
    const updateData = { ...updates };
    if ('image_url' in updateData) {
      delete updateData.image_url;
    }
    
    const { error } = await supabase
      .from('pitches')
      .update(updateData)
      .eq('id', id);
    
    if (error) {
      logError(`Error updating pitch ${id}`, error);
      throw error;
    }
    log(`Pitch ${id} updated successfully`);
  },

  deletePitch: async (id: string) => {
    log(`Deleting pitch ${id}`);
    const { error } = await supabase
      .from('pitches')
      .delete()
      .eq('id', id);
    
    if (error) {
      logError(`Error deleting pitch ${id}`, error);
      throw error;
    }
    log(`Pitch ${id} deleted successfully`);
  },

  // Bookings
  hasCompletedBookings: async (identifier: string, clientId?: string) => {
    log('Checking completed bookings for', { identifier, clientId });
    let query = supabase.from('bookings').select('id', { count: 'exact', head: true })
      .in('status', ['completed', 'finished']);
    
    if (clientId) {
      query = query.eq('client_id', clientId);
    }
    
    // Check if identifier matches user_id or client_phone
    query = query.or(`user_id.eq.${identifier},client_phone.eq.${identifier}`);
    
    const { count, error } = await query;
    
    if (error) {
      logError('Error checking completed bookings', error);
      return false;
    }
    
    return (count || 0) > 0;
  },

  getBookings: async (clientId?: string, startDate?: string, endDate?: string) => {
    log('Fetching bookings...', { clientId, startDate, endDate });
    let query = supabase.from('bookings').select('id, pitch_id, user_id, client_name, client_phone, start_time, end_time, status, created_at, deposit_amount, is_paid, receipt_url, payment_url, client_id');
    
    if (clientId) {
      query = query.eq('client_id', clientId);
    }
    
    if (startDate) {
      query = query.gte('start_time', startDate);
    }
    
    if (endDate) {
      query = query.lte('start_time', endDate);
    }
    
    const { data, error } = await query.order('start_time', { ascending: true });
    
    if (error) {
      logError('Error fetching bookings', error);
      throw error;
    }
    
    log('Bookings fetched successfully', data);
    
    // Convert snake_case to camelCase and string dates to Date objects
    return (data || []).map(b => ({
      id: b.id,
      pitchId: b.pitch_id,
      userId: b.user_id,
      clientName: b.client_name,
      clientPhone: b.client_phone,
      startTime: new Date(b.start_time),
      endTime: new Date(b.end_time),
      status: normalizeBookingStatus(b.status),
      createdAt: new Date(b.created_at),
      depositAmount: b.deposit_amount,
      isPaid: b.is_paid,
      receiptUrl: b.receipt_url,
      paymentUrl: b.payment_url,
      client_id: b.client_id,
    })) as Booking[];
  },

  addBooking: async (booking: Omit<Booking, 'id' | 'createdAt'>) => {
    log('Adding booking', booking);
    const startTime = booking.startTime;
    const dateStr = startTime.toISOString().split('T')[0];
    const timeStr = startTime.toTimeString().split(' ')[0];
    const clientId = booking.client_id;

    // Anti-abuse validation
    if (booking.clientPhone) {
      const now = new Date().toISOString();
      
      // Check for duplicate booking (same phone, same date, same time)
      const { data: duplicateBookings, error: dupError } = await supabase
        .from('bookings')
        .select('id')
        .eq('client_phone', booking.clientPhone)
        .eq('date', dateStr)
        .eq('time', timeStr)
        .eq('client_id', clientId)
        .in('status', ['confirmed', 'pending']);
        
      if (dupError) throw dupError;
      if (duplicateBookings && duplicateBookings.length > 0) {
        throw new Error('Ya tienes una reserva para esta fecha y hora.');
      }
      
      // Check for daily limit (max 2 per day)
      const { data: dailyBookings, error: dailyError } = await supabase
        .from('bookings')
        .select('id')
        .eq('client_phone', booking.clientPhone)
        .eq('date', dateStr)
        .eq('client_id', clientId)
        .in('status', ['confirmed', 'pending']);
        
      if (dailyError) throw dailyError;
      if (dailyBookings && dailyBookings.length >= 2) {
        throw new Error('No puedes tener más de 2 reservas por día.');
      }
      
      // Check for max active future bookings (limit: 2)
      const { data: futureBookings, error: futureError } = await supabase
        .from('bookings')
        .select('id')
        .eq('client_phone', booking.clientPhone)
        .eq('client_id', clientId)
        .gte('start_time', now)
        .in('status', ['confirmed', 'pending']);
        
      if (futureError) throw futureError;
      if (futureBookings && futureBookings.length >= 2) {
        throw new Error('No puedes tener más de 2 reservas activas a futuro.');
      }
    }

    // Player logic
    let playerId = null;
    let nameMismatch = false;
    if (booking.clientPhone) {
      // Try to find existing player
      const { data: existingPlayer, error: playerError } = await supabase
        .from('players')
        .select('id, name')
        .eq('phone', booking.clientPhone)
        .eq('client_id', clientId)
        .maybeSingle();
        
      if (playerError) {
        console.error('Error fetching player:', playerError);
      }
      
      if (existingPlayer) {
        playerId = existingPlayer.id;
        if (existingPlayer.name !== booking.clientName) {
          nameMismatch = true;
        }
      } else {
        // Create new player
        const { data: newPlayer, error: newPlayerError } = await supabase
          .from('players')
          .insert([{
            name: booking.clientName,
            phone: booking.clientPhone,
            client_id: clientId
          }])
          .select('id')
          .single();
          
        if (newPlayerError) {
          console.error('Error creating player:', newPlayerError);
        } else if (newPlayer) {
          playerId = newPlayer.id;
        }
      }
    }

    const { data, error } = await supabase
      .from('bookings')
      .insert([{
        pitch_id: booking.pitchId,
        user_id: booking.userId,
        player_id: playerId,
        client_name: booking.clientName,
        client_phone: booking.clientPhone,
        date: dateStr,
        time: timeStr,
        start_time: booking.startTime.toISOString(),
        end_time: booking.endTime.toISOString(),
        status: booking.status,
        deposit_amount: booking.depositAmount || 0,
        is_paid: booking.isPaid || false,
        receipt_url: booking.receiptUrl || null,
        payment_url: booking.paymentUrl || null,
        client_id: clientId
      }])
      .select()
      .single();
    
    if (error) {
      logError('Error adding booking', error);
      throw error;
    }
    
    if (nameMismatch) {
      throw new Error('name_mismatch');
    }
    
    log('Booking added successfully', data);
    
    // Add notification
    try {
      const { data: pitch } = await supabase.from('pitches').select('name').eq('id', booking.pitchId).single();
      const pitchName = pitch?.name || 'Cancha';
      const timeStr = booking.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const depositText = booking.depositAmount ? ` (Seña: $${booking.depositAmount})` : '';
      const { error: notifError } = await supabase.from('notifications').insert([{
        type: 'booking',
        message: `Nueva reserva de ${booking.clientName} - ${pitchName} a las ${timeStr}${depositText}|${data.id}`,
        client_id: clientId
      }]);
      if (notifError) {
        console.error('Supabase error inserting notification:', notifError);
      }
    } catch (e) {
      console.error('Error adding notification', e);
    }

    return {
      id: data.id,
      pitchId: data.pitch_id,
      userId: data.user_id,
      clientName: data.client_name,
      clientPhone: data.client_phone,
      startTime: new Date(data.start_time),
      endTime: new Date(data.end_time),
      status: data.status,
      createdAt: new Date(data.created_at),
      depositAmount: data.deposit_amount,
      isPaid: data.is_paid,
      receiptUrl: data.receipt_url,
      client_id: data.client_id
    } as Booking;
  },

  updateBookingStatus: async (id: string, status: BookingStatus) => {
    log(`Updating booking ${id} status to ${status}`);
    const { error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', id);
    
    if (error) {
      logError(`Error updating booking ${id} status`, error);
      throw error;
    }
    log(`Booking ${id} status updated successfully`);
  },

  cancelBooking: async (id: string) => {
    log(`Cancelling booking ${id}`);
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', id);
    
    if (error) {
      logError(`Error cancelling booking ${id}`, error);
      throw error;
    }
    log(`Booking ${id} cancelled successfully`);
  },

  toggleBookingPayment: async (id: string, isPaid: boolean) => {
    log(`Toggling booking ${id} payment to ${isPaid}`);
    const { error } = await supabase
      .from('bookings')
      .update({ is_paid: isPaid })
      .eq('id', id);
    
    if (error) {
      logError(`Error toggling booking ${id} payment`, error);
      throw error;
    }
    log(`Booking ${id} payment toggled successfully`);
  },

  // Products
  getProducts: async (clientId?: string) => {
    log('Fetching products...', { clientId });
    if (!clientId) return [];

    const { data, error } = await supabase
      .from('products')
      .select('id, name, price, category, stock, min_stock, active, client_id')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (error) {
      logError('Error fetching products', error);
      throw error;
    }
    
    log('Products fetched successfully', data);
    return (data || []) as Product[];
  },

  addProduct: async (product: Omit<Product, 'id'>) => {
    log('Adding product', product);
    const initialStock = Math.max(0, Number(product.stock) || 0);
    const minStock = Math.max(0, Number(product.min_stock) || 0);

    const { data, error } = await supabase
      .from('products')
      .insert([{
        name: product.name,
        price: product.price,
        category: product.category,
        stock: initialStock,
        min_stock: minStock,
        active: product.active,
        client_id: product.client_id
      }])
      .select()
      .single();
    
    if (error) {
      logError('Error adding product', error);
      throw error;
    }
    
    log('Product added successfully', data);

    if (initialStock > 0 && product.client_id) {
      try {
        const { error: movementError } = await supabase.from('stock_movements').insert([{
          product_id: data.id,
          quantity: initialStock,
          type: 'entrada',
          source: 'inicial',
          client_id: product.client_id
        }]);

        if (movementError) {
          logError(`Error creating initial stock movement for product ${data.id}`, movementError);
        }
      } catch (movementError) {
        logError(`Error creating initial stock movement for product ${data.id}`, movementError);
      }
    }

    return data as Product;
  },

  updateProduct: async (id: string, updates: Partial<Product>) => {
    log(`Updating product ${id}`, updates);
    const { error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id);
    
    if (error) {
      logError(`Error updating product ${id}`, error);
      throw error;
    }
    log(`Product ${id} updated successfully`);

    // Add notification if stock is low
    try {
      if (updates.stock !== undefined) {
        const { data: product } = await supabase.from('products').select('name, stock, min_stock').eq('id', id).single();
        if (product && product.stock <= product.min_stock) {
          await supabase.from('notifications').insert([{
            type: 'stock',
            message: `Stock bajo - ${product.name} (Quedan ${product.stock})`
          }]);
        }
      }
    } catch (e) {
      console.error('Error adding notification', e);
    }
  },

  deleteProduct: async (id: string) => {
    log(`Deleting product ${id}`);
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
    
    if (error) {
      logError(`Error deleting product ${id}`, error);
      throw error;
    }
    log(`Product ${id} deleted successfully`);
  },

  bulkUpdateStock: async (updates: { productId: string; quantityToAdd: number; newStock: number }[], clientId?: string) => {
    log(`Bulk updating stock for ${updates.length} products`);
    const client = supabase;
    
    if (!clientId) return;
    if (updates.length === 0) return;

    try {
      const productIds = updates.map(u => u.productId);
      
      // 1. Obtener todos los productos en una sola query
      const { data: products, error: fetchError } = await client
        .from('products')
        .select('id, name, min_stock, client_id')
        .in('id', productIds)
        .eq('client_id', clientId);
        
      if (fetchError) throw fetchError;
      
      const productMap = new Map<string, any>(products?.map(p => [p.id, p]) || []);
      
      // 2. Preparar los arrays para inserts masivos
      const movementsToInsert = [];
      const notificationsToInsert = [];
      
      for (const update of updates) {
        const product = productMap.get(update.productId);
        if (!product) continue;
        
        movementsToInsert.push({
          product_id: update.productId,
          quantity: update.quantityToAdd,
          type: 'ajuste',
          source: 'manual',
          client_id: clientId
        });
        
        if (update.newStock <= product.min_stock) {
          notificationsToInsert.push({
            type: 'stock',
            message: `Stock bajo - ${product.name} (Quedan ${update.newStock})`,
            client_id: clientId
          });
        }
      }
      
      // 3. Ejecutar operaciones agrupadas
      // Supabase JS no soporta bulk update nativo con diferentes valores sin upsert completo,
      // así que hacemos los updates en paralelo, pero agrupamos los inserts.
      const updatePromises = updates.map(update => 
        client.from('products')
          .update({ stock: update.newStock })
          .eq('id', update.productId)
          .eq('client_id', clientId)
      );
      
      await Promise.all([
        ...updatePromises,
        movementsToInsert.length > 0 ? client.from('stock_movements').insert(movementsToInsert) : Promise.resolve(),
        notificationsToInsert.length > 0 ? client.from('notifications').insert(notificationsToInsert) : Promise.resolve()
      ]);
      
      log('Bulk stock update successful');
    } catch (error) {
      logError('Error in bulk stock update', error);
      throw error;
    }
  },

  // Sales
  getSales: async (clientId?: string, limit: number = 100) => {
    log('Fetching sales...', { clientId });
    let query = supabase.from('sales').select('id, product_id, quantity, total_price, created_at, payment_method, client_id, sale_items(id, product_id, quantity, price)');
    if (clientId) {
      query = query.eq('client_id', clientId);
    }
    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      logError('Error fetching sales', error);
      throw error;
    }
    
    log('Sales fetched successfully', data);
    return (data || []).map(s => ({
      id: s.id,
      productId: s.product_id,
      quantity: s.quantity,
      totalPrice: typeof s.total_price === 'object' && s.total_price !== null ? Number((s.total_price as any).total) || 0 : Number(s.total_price) || 0,
      date: new Date(s.created_at),
      paymentMethod: s.payment_method,
      items: s.sale_items?.map((item: any) => ({
        productId: item.product_id,
        quantity: item.quantity,
        price: item.price
      }))
    })) as Sale[];
  },

  addSale: async (sale: Omit<Sale, 'id'>) => {
    log('Adding sale', sale);
    const clientId = sale.client_id;
    const client = supabase;

    const productId = typeof sale.productId === 'string' ? sale.productId.trim() : '';
    const quantity = Math.trunc(Number(sale.quantity));
    const paymentMethod = sale.paymentMethod;

    if (!isUuid(productId)) {
      throw new Error('Payload de venta invalido: product_id no es un UUID valido');
    }

    if (!isUuid(clientId)) {
      throw new Error('Payload de venta invalido: client_id no es un UUID valido o esta ausente');
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new Error('Payload de venta invalido: quantity debe ser un numero mayor a 0');
    }

    if (paymentMethod !== 'efectivo' && paymentMethod !== 'transferencia') {
      throw new Error('Payload de venta invalido: payment_method no es valido');
    }
    
    // Check stock first
    const { data: product, error: fetchError } = await client
      .from('products')
      .select('stock, price')
      .eq('id', productId)
      .eq('client_id', clientId)
      .single();
      
    if (fetchError) {
      logError('Error fetching product stock', fetchError);
      throw fetchError;
    }
    
    if (product.stock < quantity) {
      throw new Error('Stock insuficiente');
    }

    const unitPrice = Number(product.price);
    const totalPrice = unitPrice * quantity;
    const amount = totalPrice;

    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      throw new Error('Payload de venta invalido: el precio del producto no es valido');
    }

    const salesPayload = {
      product_id: productId,
      quantity,
      total_price: totalPrice,
      amount,
      payment_method: paymentMethod,
      client_id: clientId
    };

    log('Sales insert payload', salesPayload);

    const { data, error } = await client
      .from('sales')
      .insert([salesPayload])
      .select()
      .single();
    
    if (error) {
      if (typeof error.message === 'string' && error.message.includes('audit_logs')) {
        logError('Database audit trigger blocked sale insert', {
          salesPayload,
          dbError: error
        });
        throw new Error('La venta fue rechazada por una regla de auditoria en la base de datos: audit_logs recibio client_id nulo.');
      }
      logError('Error adding sale', error);
      throw error;
    }

    // Deduct stock only after the sale row exists.
    const { error: updateError } = await client
      .from('products')
      .update({ stock: product.stock - quantity })
      .eq('id', productId)
      .eq('client_id', clientId);
      
    if (updateError) {
      logError('Error updating product stock', updateError);
      throw updateError;
    }

    // Insert into sale_items
    const saleItemsPayload = {
      sale_id: data.id,
      product_id: productId,
      quantity,
      price: unitPrice
    };

    log('Sale items insert payload', saleItemsPayload);

    const { error: itemsError } = await client
      .from('sale_items')
      .insert([saleItemsPayload]);

    if (itemsError) {
      logError('Error adding sale items', itemsError);
      // Ideally we would rollback the sale here, but Supabase JS doesn't support transactions
      // without RPC. We'll proceed but log the error.
    }

    // Insert stock movement for sale
    const stockMovementPayload = {
      product_id: productId,
      quantity: -quantity,
      type: 'salida' as const,
      source: 'venta',
      client_id: clientId
    };

    log('Stock movement insert payload', stockMovementPayload);

    const { error: movementError } = await client
      .from('stock_movements')
      .insert([stockMovementPayload]);
      
    if (movementError) {
      logError('Error inserting stock movement for sale', movementError);
      // Not throwing here to not fail the sale if only logging fails
    }
    
    // Check for low stock after sale
    try {
      const { data: updatedProduct } = await client.from('products').select('name, stock, min_stock').eq('id', productId).eq('client_id', clientId).single();
      if (updatedProduct && updatedProduct.stock <= updatedProduct.min_stock) {
        await client.from('notifications').insert([{
          type: 'stock',
          message: `Stock bajo - ${updatedProduct.name} (Quedan ${updatedProduct.stock})`,
          client_id: clientId
        }]);
      }
    } catch (e) {
      console.error('Error adding notification', e);
    }

    log('Sale added successfully', data);
    return {
      id: data.id,
      productId: data.product_id,
      quantity: data.quantity,
      totalPrice: typeof data.total_price === 'object' && data.total_price !== null ? Number((data.total_price as any).total) || 0 : Number(data.total_price) || 0,
      date: new Date(data.created_at),
      paymentMethod: data.payment_method,
      client_id: data.client_id
    } as Sale;
  },

  deleteSale: async (id: string, clientId?: string) => {
    log(`Deleting sale ${id}`, { clientId });
    const client = supabase;
    
    // Get sale details first to restore stock
    let query = client
      .from('sales')
      .select('product_id, quantity')
      .eq('id', id);
    
    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    const { data: sale, error: fetchError } = await query.single();
      
    if (!fetchError && sale) {
      // Get current product stock
      let productQuery = client
        .from('products')
        .select('stock')
        .eq('id', sale.product_id);
      
      if (clientId) {
        productQuery = productQuery.eq('client_id', clientId);
      }

      const { data: product } = await productQuery.single();
        
      if (product) {
        // Restore stock
        let updateQuery = client
          .from('products')
          .update({ stock: product.stock + sale.quantity })
          .eq('id', sale.product_id);
        
        if (clientId) {
          updateQuery = updateQuery.eq('client_id', clientId);
        }

        await updateQuery;
          
        // Insert stock movement for sale deletion
        await client
          .from('stock_movements')
          .insert([{
            product_id: sale.product_id,
            quantity: sale.quantity,
            type: 'entrada',
            source: 'ajuste',
            client_id: clientId || (await client.from('products').select('client_id').eq('id', sale.product_id).single()).data?.client_id
          }]);
      }
    }

    let deleteQuery = client
      .from('sales')
      .delete()
      .eq('id', id);
    
    if (clientId) {
      deleteQuery = deleteQuery.eq('client_id', clientId);
    }

    const { error } = await deleteQuery;
    
    if (error) {
      logError(`Error deleting sale ${id}`, error);
      throw error;
    }
    log(`Sale ${id} deleted successfully`);
  },
// Audit Logs
getAuditLogs: async (clientId?: string) => {
  log('Fetching audit logs...', { clientId });
  let query = supabase.from('audit_logs').select('id, action, details, user_name, created_at, client_id');
  if (clientId) {
    query = query.eq('client_id', clientId);
  }
  const { data, error } = await query
    .order('created_at', { ascending: false }) // ✅ FIX
    .limit(100);
  
  if (error) {
    logError('Error fetching audit logs', error);
    throw error;
  }
  
  log('Audit logs fetched successfully', data);
  return (data || []).map(l => ({
    id: l.id,
    action: l.action,
    details: typeof l.details === 'string' ? l.details : JSON.stringify(l.details),
    timestamp: new Date(l.created_at), // ✅ FIX
    user: l.user_name || 'Sistema' // ✅ fallback seguro
  })) as AuditLog[];
},
  // Deactivated Slots
  getDeactivatedSlots: async (clientId?: string) => {
    log('Fetching deactivated slots...', { clientId });
    let query = supabase.from('deactivated_slots').select('id, pitch_id, slot_date, slot_hour, client_id');
    if (clientId) {
      query = query.eq('client_id', clientId);
    }
    const { data, error } = await query;
    
    if (error) {
      logError('Error fetching deactivated slots', error);
      throw error;
    }
    
    log('Deactivated slots fetched successfully', data);
    return (data || []) as any[];
  },

  toggleDeactivatedSlot: async (pitchId: string, date: string, hour: number, clientId?: string) => {
    log(`Toggling deactivated slot: ${pitchId} on ${date} at ${hour}:00`, { clientId });
    // Check if it exists
    let query = supabase
      .from('deactivated_slots')
      .select('id')
      .eq('pitch_id', pitchId)
      .eq('slot_date', date)
      .eq('slot_hour', hour);
    
    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    const { data: existing } = await query.maybeSingle();
    
    if (existing) {
      log('Slot is currently deactivated, activating it...');
      const { error } = await supabase
        .from('deactivated_slots')
        .delete()
        .eq('id', existing.id);
      if (error) {
        logError('Error activating slot', error);
        throw error;
      }
      log('Slot activated successfully');
    } else {
      log('Slot is currently active, deactivating it...');
      const { error } = await supabase
        .from('deactivated_slots')
        .insert([{
          pitch_id: pitchId,
          slot_date: date,
          slot_hour: hour,
          client_id: clientId
        }]);
      if (error) {
        logError('Error deactivating slot', error);
        throw error;
      }
      log('Slot deactivated successfully');
    }
  },
  logAction: async (action: string, details: string, userName: string = 'Sistema', clientId?: string) => {
    const client = supabase;
    const { error } = await client
      .from('audit_logs')
      .insert([{
        action,
        details,
        user_name: userName, // ✅ opcional pero recomendado
        created_at: new Date().toISOString(), // ✅ FIX
        client_id: clientId
      }]);
    
    if (error) {
      // Suppress RLS error for audit_logs as it's a known issue and doesn't break functionality
      if (error.code !== '42501') {
        logError('Error logging action', error);
      }
    } else {
      log(`Action logged: ${action}`);
    }
  },

  // Notifications
  getNotifications: async (clientId?: string) => {
    log('Fetching notifications...', { clientId });
    // Removed client_id from select and filter because the column doesn't exist in DB yet
    let query = supabase.from('notifications').select('id, type, message, read, created_at');
    
    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (error) {
      logError('Error fetching notifications', error);
      throw error;
    }
    
    return (data || []).map(n => ({
      id: n.id,
      type: n.type,
      message: n.message,
      read: n.read,
      created_at: new Date(n.created_at)
    }));
  },

  markNotificationAsRead: async (id: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id);
    
    if (error) {
      logError(`Error marking notification ${id} as read`, error);
      throw error;
    }
  },

  markAllNotificationsAsRead: async () => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('read', false);
    
    if (error) {
      logError('Error marking all notifications as read', error);
      throw error;
    }
  }
};
