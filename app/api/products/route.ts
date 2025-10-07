import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, price, category, is_available = true, image_url } = body

    // Validate required fields
    if (!name || !price) {
      return NextResponse.json({ 
        error: "Nombre y precio son campos obligatorios" 
      }, { status: 400 })
    }

    // Insert product
    const { data: product, error } = await supabase
      .from("products")
      .insert({
        user_id: user.id,
        name: name.trim(),
        description: description?.trim() || null,
        price: parseFloat(price),
        category: category?.trim() || null,
        is_available,
        image_url: image_url?.trim() || null,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating product:", error)
      return NextResponse.json({ 
        error: "Error al crear el producto" 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      product,
      message: "Producto creado exitosamente"
    })

  } catch (error) {
    console.error("Error in products API:", error)
    return NextResponse.json({ 
      error: "Error interno del servidor" 
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    // Get all products for the user
    const { data: products, error } = await supabase
      .from("products")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching products:", error)
      return NextResponse.json({ 
        error: "Error al obtener productos" 
      }, { status: 500 })
    }

    // Get unique categories
    const categories = [...new Set(products?.map(p => p.category).filter(Boolean))]

    return NextResponse.json({ 
      products: products || [], 
      categories: categories || []
    })

  } catch (error) {
    console.error("Error in products API:", error)
    return NextResponse.json({ 
      error: "Error interno del servidor" 
    }, { status: 500 })
  }
}