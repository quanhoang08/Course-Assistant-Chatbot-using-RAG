from django.contrib import admin
from import_export.admin import ImportExportModelAdmin
from import_export import resources, fields
from import_export.widgets import ForeignKeyWidget, ManyToManyWidget
from django.contrib.auth.models import User
from .models import Course, Document

class CourseResource(resources.ModelResource):
    teacher = fields.Field(
        column_name='teacher',
        attribute='teacher',
        widget=ForeignKeyWidget(User, field='username')
    )

    students = fields.Field(
        column_name='students',
        attribute='students',
        widget=ManyToManyWidget(User, field='username', separator=',')
    )

    class Meta:
        model = Course
        fields = ('course_code', 'name', 'teacher', 'students')
        import_id_fields = ('course_code',)

class DocumentInline(admin.TabularInline):
    model = Document
    extra = 1 
    readonly_fields = ('is_processed', 'uploaded_at')

@admin.register(Course)
class CourseAdmin(ImportExportModelAdmin):
    resource_classes = [CourseResource]
    
    list_display = ('course_code', 'name', 'teacher', 'get_student_count')
    list_filter = ('teacher',)
    search_fields = ('course_code', 'name')
    filter_horizontal = ('students',) 
    inlines = [DocumentInline] 

    def get_student_count(self, obj):
        return obj.students.count()
    get_student_count.short_description = "Số lượng sinh viên"

@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ('title', 'course', 'uploaded_at', 'is_processed')
    list_filter = ('course', 'is_processed')
    search_fields = ('title', 'course__name')
    readonly_fields = ('is_processed', 'uploaded_at')
