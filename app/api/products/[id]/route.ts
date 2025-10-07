import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    
    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, price, category, is_available, image_url } = body
    const productId = params.id

    // Validate required fields
    if (!name || !price) {
      return NextResponse.json({ 
        error: "Nombre y precio son campos obligatorios" 
      }, { status: 400 })
    }

    // Update product
    const { data: product, error } = await supabase
      .from("products")
      .update({
        name: name.trim(),
        description: description?.trim() || null,
        price: parseFloat(price),
        category: category?.trim() || null,
        is_available: is_available ?? true,
        image_url: image_url?.trim() || null,
      })
      .eq("id", productId)
      .eq("user_id", user.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating product:", error)
      return NextResponse.json({ 
        error: "Error al actualizar el producto" 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      product,
      message: "Producto actualizado exitosamente"
    })

  } catch (error) {
    console.error("Error in update product API:", error)
    return NextResponse.json({ 
      error: "Error interno del servidor" 
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    
    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const productId = params.id

    // First get the product to check for image_url
    const { data: product, error: fetchError } = await supabase
      .from("products")
      .select("image_url")
      .eq("id", productId)
      .eq("user_id", user.id)
      .single()

    if (fetchError) {
      console.error("Error fetching product:", fetchError)
      return NextResponse.json({ 
        error: "Producto no encontrado" 
      }, { status: 404 })
    }

    // Delete image from Supabase Storage if it exists and is from our storage
    if (product.image_url && product.image_url.includes('supabase')) {
      try {
        // Extract filename from the public URL
        const urlParts = product.image_url.split('/')
        const filename = `${user.id}/${urlParts[urlParts.length - 1]}`
        
        await supabase.storage
          .from('product-images')
          .remove([filename])
      } catch (storageError) {
        console.error("Error deleting image from storage:", storageError)
        // Continue with product deletion even if image deletion fails
      }
    }

    // Delete product (RLS will ensure user can only delete their own products)
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", productId)
      .eq("user_id", user.id)

    if (error) {
      console.error("Error deleting product:", error)
      return NextResponse.json({ 
        error: "Error al eliminar el producto" 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: "Producto eliminado exitosamente"
    })

  } catch (error) {
    console.error("Error in delete product API:", error)
    return NextResponse.json({ 
      error: "Error interno del servidor" 
    }, { status: 500 })
  }
}