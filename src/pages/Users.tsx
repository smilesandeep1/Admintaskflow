import { useEffect, useState } from "react";
import { profilesApi } from "@/db/api";
import { useAuth } from "@/components/auth/AuthProvider";
import type { Profile, UserRole } from "@/types/types";
import { SECTIONS, DESIGNATIONS } from "@/types/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { Edit, Trash2, Users as UsersIcon, Grid3x3, List } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { formatUserNameWithDesignation } from "@/lib/userUtils";

type ViewMode = 'grid' | 'list';

export default function Users() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  const editForm = useForm<{
    full_name: string;
    designation: string;
    official_designation: string;
    role: UserRole;
    sections: string[];
    mobile_number: string;
  }>({
    defaultValues: {
      full_name: "",
      designation: "",
      official_designation: "",
      role: "L4",
      sections: [],
      mobile_number: ""
    }
  });

  // Watch the role field to dynamically update designation options
  const selectedRole = editForm.watch("role");

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await profilesApi.getAll();
      setUsers(data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load users"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user: Profile) => {
    setSelectedUser(user);
    editForm.reset({
      full_name: user.full_name,
      designation: user.designation,
      official_designation: user.official_designation || "",
      role: user.role,
      sections: user.sections,
      mobile_number: user.mobile_number || ""
    });
    setEditDialogOpen(true);
  };

  const handleUpdateUser = async (values: {
    full_name: string;
    designation: string;
    official_designation: string;
    role: UserRole;
    sections: string[];
    mobile_number: string;
  }) => {
    if (!selectedUser) return;

    try {
      await profilesApi.update(selectedUser.id, {
        full_name: values.full_name,
        designation: values.designation,
        official_designation: values.official_designation || null,
        role: values.role,
        sections: values.sections,
        mobile_number: values.mobile_number || null
      });

      toast({
        title: "Success",
        description: "User updated successfully"
      });

      setEditDialogOpen(false);
      loadUsers();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update user"
      });
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      await profilesApi.delete(selectedUser.id);
      toast({
        title: "Success",
        description: "User deleted successfully"
      });
      setDeleteDialogOpen(false);
      setSelectedUser(null);
      loadUsers();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete user"
      });
    }
  };

  const getDesignationOptions = (role: UserRole): string[] => {
    const designation = DESIGNATIONS[role];
    // Handle L2 which has multiple designations
    if (role === 'L2') {
      return ['ADFM I', 'ADFM II', 'ADFM III', 'ADFM IV'];
    }
    // Handle other roles with single designation
    return [designation as string];
  };

  const getRoleBadge = (role: UserRole) => {
    const colors: Record<UserRole, string> = {
      admin: "bg-primary text-primary-foreground",
      L1: "bg-primary/80 text-primary-foreground",
      L2: "bg-primary/60 text-primary-foreground",
      L3: "bg-primary/40 text-primary-foreground",
      L4: "bg-muted text-muted-foreground"
    };
    return <Badge className={colors[role]}>{role}</Badge>;
  };

  const canManageUsers = profile?.role === "admin" || profile?.role === "L1";

  if (!canManageUsers) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center">
            <UsersIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">You don't have permission to manage users</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground mt-1">Manage user roles, designations, and sections</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4 mr-2" />
            List
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid3x3 className="h-4 w-4 mr-2" />
            Grid
          </Button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="grid gap-4">
          {users.map((user) => (
            <Card key={user.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">
                      {formatUserNameWithDesignation(user.full_name, user.official_designation)}
                    </CardTitle>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {getRoleBadge(user.role)}
                      <Badge variant="outline">{user.designation}</Badge>
                      {user.email && <Badge variant="outline">{user.email}</Badge>}
                      {user.mobile_number && <Badge variant="outline">📱 {user.mobile_number}</Badge>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditUser(user)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {user.id !== profile?.id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div>
                  <h4 className="text-sm font-semibold mb-2">Assigned Sections:</h4>
                  {user.sections.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {user.sections.sort().map((section) => (
                        <Badge key={section} variant="secondary" className="text-xs">
                          {section}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No sections assigned</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {users.map((user) => (
            <Card key={user.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">
                      {formatUserNameWithDesignation(user.full_name, user.official_designation)}
                    </CardTitle>
                    <div className="flex gap-1 mt-2">
                      {getRoleBadge(user.role)}
                    </div>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEditUser(user)}
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    {user.id !== profile?.id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setSelectedUser(user);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Designation</p>
                  <Badge variant="outline" className="text-xs">{user.designation}</Badge>
                </div>
                {user.email && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-xs truncate">{user.email}</p>
                  </div>
                )}
                {user.mobile_number && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Mobile</p>
                    <p className="text-xs">📱 {user.mobile_number}</p>
                  </div>
                )}
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-semibold">Sections</p>
                  {user.sections.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {user.sections.sort().slice(0, 3).map((section) => (
                        <Badge key={section} variant="secondary" className="text-xs">
                          {section}
                        </Badge>
                      ))}
                      {user.sections.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{user.sections.length - 3}
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No sections</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information and permissions</DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleUpdateUser)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="full_name"
                rules={{ required: "Name is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter full name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="mobile_number"
                rules={{
                  pattern: {
                    value: /^[+]?[\d\s-()]+$/,
                    message: "Please enter a valid mobile number"
                  },
                  minLength: {
                    value: 10,
                    message: "Mobile number must be at least 10 digits"
                  }
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobile Number (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter mobile number (e.g., +91-9876543210)" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="role"
                  rules={{ required: "Role is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(value);
                          // Reset designation when role changes
                          const newRole = value as UserRole;
                          const designationOptions = getDesignationOptions(newRole);
                          // Set first designation option as default
                          editForm.setValue("designation", designationOptions[0]);
                        }} 
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="L1">L1</SelectItem>
                          <SelectItem value="L2">L2</SelectItem>
                          <SelectItem value="L3">L3</SelectItem>
                          <SelectItem value="L4">L4</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="designation"
                  rules={{ required: "Designation is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Designation</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select designation" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {getDesignationOptions(selectedRole).map((designation) => (
                            <SelectItem key={designation} value={designation}>
                              {designation}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={editForm.control}
                name="official_designation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Official Desig (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter official designation (e.g., Senior Divisional Finance Manager)" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="sections"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sections</FormLabel>
                    <div className="grid grid-cols-3 gap-2 border rounded-md p-4 max-h-60 overflow-y-auto">
                      {SECTIONS.map((section) => (
                        <div key={section} className="flex items-center space-x-2">
                          <Checkbox
                            id={`section-${section}`}
                            checked={field.value?.includes(section)}
                            onCheckedChange={(checked) => {
                              const current = field.value || [];
                              if (checked) {
                                field.onChange([...current, section]);
                              } else {
                                field.onChange(current.filter((s) => s !== section));
                              }
                            }}
                          />
                          <label
                            htmlFor={`section-${section}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {section}
                          </label>
                        </div>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Update User</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
